import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { hasSameOrigin, requireGymStaff } from "@/lib/auth/route-guard";

export async function GET(request: Request) {
  const auth = await requireGymStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const searchParams = new URL(request.url).searchParams;
  const search = (searchParams.get("q") ?? "")
    .slice(0, 80)
    .replace(/[^\p{L}\p{N} .'-]/gu, "");

  let profileQuery = auth.supabase
    .from("profiles")
    .select("user_id,email,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (search) {
    profileQuery = profileQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data: profiles, error: profileError } = await profileQuery;
  if (profileError) {
    console.error("Staff member search failed.", profileError);
    return NextResponse.json({ error: "Member search failed." }, { status: 500 });
  }

  const memberIds = profiles.map((profile) => profile.user_id);
  if (memberIds.length === 0) {
    return NextResponse.json({ members: [] });
  }

  const [
    { data: memberships, error: membershipsError },
    { data: maksisoftLinks, error: linksError },
    { data: auditLogs, error: auditError },
  ] = await Promise.all([
      auth.supabase
        .from("memberships")
        .select("id,member_id,status,source,starts_at,expires_at,suspended_at,privileges")
        .in("member_id", memberIds)
        .order("created_at", { ascending: false }),
      auth.supabase
        .from("maksisoft_member_links")
        .select("member_id,external_member_id,status,linked_at,last_synced_at,last_sync_error")
        .in("member_id", memberIds),
      auth.supabase
        .from("gym_audit_logs")
        .select("id,target_member_id,action,details,created_at")
        .in("target_member_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (membershipsError || linksError || auditError) {
    console.error("Staff member detail lookup failed.", {
      membershipsError,
      linksError,
      auditError,
    });
    return NextResponse.json({ error: "Member details could not be loaded." }, { status: 500 });
  }

  const members = profiles.map((profile) => ({
    ...profile,
    membership:
      memberships.find((membership) => membership.member_id === profile.user_id) ?? null,
    maksisoftLink:
      maksisoftLinks.find((link) => link.member_id === profile.user_id) ?? null,
    auditLogs: auditLogs.filter((log) => log.target_member_id === profile.user_id),
  }));
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const auth = await requireGymStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("fullName" in body) ||
    typeof body.email !== "string" ||
    typeof body.fullName !== "string"
  ) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const fullName = body.fullName.trim();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    fullName.length < 1 ||
    fullName.length > 120
  ) {
    return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
  }

  const config = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Member invitations require the server-only Supabase service-role key." },
      { status: 503 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let redirectOrigin: URL;
  try {
    redirectOrigin = new URL(siteUrl ?? "");
    if (!["http:", "https:"].includes(redirectOrigin.protocol)) {
      throw new Error("Unsupported site URL scheme.");
    }
  } catch {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_SITE_URL to the public site URL before inviting members." },
      { status: 503 },
    );
  }

  const adminClient = createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: invitedUser, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: new URL("/auth/callback?next=/account", redirectOrigin).toString(),
    });

  if (inviteError || !invitedUser.user) {
    console.error("Could not invite member account.", inviteError);
    return NextResponse.json(
      { error: "Member invitation failed. Check the email and Supabase email settings." },
      { status: 502 },
    );
  }

  const { error: membershipError } = await auth.supabase.rpc("admin_create_pending_membership", {
    p_member_id: invitedUser.user.id,
  });

  if (membershipError) {
    console.error("Member was invited but the pending membership record failed.", membershipError);
    return NextResponse.json(
      {
        error:
          "The invite was sent, but the pending membership record could not be created. Review the member record before activation.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ invited: true }, { status: 201 });
}

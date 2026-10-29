import { NextResponse } from "next/server";
import { hasSameOrigin, requireGymStaff } from "@/lib/auth/route-guard";

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
    !("operation" in body) ||
    !("memberId" in body) ||
    typeof body.memberId !== "string"
  ) {
    return NextResponse.json({ error: "A member and link operation are required." }, { status: 400 });
  }

  if (body.operation === "link" && "externalMemberId" in body) {
    if (typeof body.externalMemberId !== "string") {
      return NextResponse.json({ error: "Invalid external member identifier." }, { status: 400 });
    }
    const externalMemberId = body.externalMemberId.trim();
    if (
      externalMemberId.length < 1 ||
      externalMemberId.length > 128 ||
      /[\u0000-\u001f\u007f]/.test(externalMemberId)
    ) {
      return NextResponse.json({ error: "Invalid external member identifier." }, { status: 400 });
    }

    const { error } = await auth.supabase.rpc("admin_link_maksisoft_member", {
      p_member_id: body.memberId,
      p_external_member_id: externalMemberId,
    });
    if (error) {
      console.error("Maksisoft member linking failed.", error);
      return NextResponse.json(
        {
          error:
            error.code === "42501"
              ? "Staff authorization failed."
              : error.code === "23505"
                ? "That Maksisoft member is already linked to another Lotus account."
                : "Maksisoft member link could not be saved.",
        },
        { status: error.code === "42501" ? 403 : error.code === "23505" ? 409 : 400 },
      );
    }
    return NextResponse.json({ linked: true, synchronization: "pending" });
  }

  if (body.operation === "revoke") {
    const { error } = await auth.supabase.rpc("admin_revoke_maksisoft_link", {
      p_member_id: body.memberId,
    });
    if (error) {
      console.error("Maksisoft member-link revocation failed.", error);
      return NextResponse.json(
        { error: error.code === "42501" ? "Staff authorization failed." : "Link revocation failed." },
        { status: error.code === "42501" ? 403 : 400 },
      );
    }
    return NextResponse.json({ revoked: true });
  }

  return NextResponse.json({ error: "Invalid Maksisoft link operation." }, { status: 400 });
}

import { createSupabaseServerClient } from "@/lib/supabase/server";

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export type RouteAuthResult =
  | { ok: true; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>; userId: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

export async function requireGymStaff(): Promise<RouteAuthResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Member services are not configured. Set up Supabase first.",
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, status: 401, error: "Sign in is required." };
  }
  if (!data.user.email_confirmed_at) {
    return { ok: false, status: 403, error: "A verified staff email is required." };
  }

  const { data: isStaff, error: roleError } = await supabase.rpc("is_gym_staff");
  if (roleError) {
    console.error("Could not verify staff permission.", roleError);
    return {
      ok: false,
      status: 503,
      error: "Staff permissions could not be verified.",
    };
  }
  if (isStaff !== true) {
    return { ok: false, status: 403, error: "Gym staff access is required." };
  }

  return { ok: true, supabase, userId: data.user.id };
}

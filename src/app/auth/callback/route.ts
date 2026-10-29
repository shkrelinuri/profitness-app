import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null, requestUrl: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  try {
    const target = new URL(value, requestUrl);
    return target.origin === new URL(requestUrl).origin
      ? `${target.pathname}${target.search}${target.hash}`
      : "/account";
  } catch {
    return "/account";
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=auth_not_configured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase auth callback failed.", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }

  const nextPath = getSafeNextPath(
    request.nextUrl.searchParams.get("next"),
    request.url,
  );
  return NextResponse.redirect(new URL(nextPath, request.url));
}

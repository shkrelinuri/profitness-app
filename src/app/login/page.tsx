import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Member login",
  description: "Member login for Lotus Fitness Gym is not yet available.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /> Member area</p>
        <h1>Member login</h1>
        {!isSupabaseConfigured() && (
          <p className="status-notice">
            Member authentication is not configured. Set up Supabase using
            the project instructions before enabling account access.
          </p>
        )}
        <AuthForm errorCode={error} mode="login" />
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /> Member area</p>
        <h1>Member login</h1>
        <p className="status-description">Loading sign-in…</p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LocalizedText } from "@/components/language-provider";
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
        <p className="eyebrow"><span /><LocalizedText id="login.kicker" /></p>
        <h1><LocalizedText id="login.title" /></h1>
        {!isSupabaseConfigured() && (
          <LocalizedText as="p" className="status-notice" id="login.description" />
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
        <p className="eyebrow"><span /><LocalizedText id="login.kicker" /></p>
        <h1><LocalizedText id="login.title" /></h1>
        <LocalizedText as="p" className="status-description" id="login.loading" />
      </div>
    </main>
  );
}

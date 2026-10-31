import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import AuthForm from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create a member account",
  description: "Create and verify a Lotus Fitness Gym member account.",
};

export default function RegisterPage() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /><LocalizedText id="register.kicker" /></p>
        <h1><LocalizedText id="register.title" /></h1>
        <LocalizedText as="p" className="status-description" id="register.description" />
        {!isSupabaseConfigured() && (
          <p className="status-notice"><LocalizedText id="register.unconfigured" /></p>
        )}
        <AuthForm mode="register" />
      </div>
    </main>
  );
}

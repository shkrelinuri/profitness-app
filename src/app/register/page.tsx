import type { Metadata } from "next";
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
        <p className="eyebrow"><span /> Join Lotus</p>
        <h1>Create account</h1>
        <p className="status-description">
          Verify your email to create your member account. Account creation
          does not activate a membership or door-access card.
        </p>
        {!isSupabaseConfigured() && (
          <p className="status-notice">Member authentication is not configured yet.</p>
        )}
        <AuthForm mode="register" />
      </div>
    </main>
  );
}

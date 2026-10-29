import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for your member account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /> Account security</p>
        <h1>Reset password</h1>
        <p className="status-description">
          We will send a secure reset link to the email address on your account.
        </p>
        <AuthForm mode="reset" />
      </div>
    </main>
  );
}

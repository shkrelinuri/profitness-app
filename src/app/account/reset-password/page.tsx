import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new secure password for your member account.",
};

export default function NewPasswordPage() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /> Account security</p>
        <h1>Choose a new password</h1>
        <p className="status-description">
          Set a new password to finish securing your member account.
        </p>
        <AuthForm mode="new-password" />
      </div>
    </main>
  );
}

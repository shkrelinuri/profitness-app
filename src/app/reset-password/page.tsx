import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure password reset link for your member account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /><LocalizedText id="reset.kicker" /></p>
        <h1><LocalizedText id="reset.title" /></h1>
        <LocalizedText as="p" className="status-description" id="reset.description" />
        <AuthForm mode="reset" />
      </div>
    </main>
  );
}

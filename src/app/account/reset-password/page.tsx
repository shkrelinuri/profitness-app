import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new secure password for your member account.",
};

export default function NewPasswordPage() {
  return (
    <main className="status-page">
      <div className="status-content auth-content">
        <p className="eyebrow"><span /><LocalizedText id="reset.kicker" /></p>
        <h1><LocalizedText id="reset.newTitle" /></h1>
        <LocalizedText as="p" className="status-description" id="reset.newDescription" />
        <AuthForm mode="new-password" />
      </div>
    </main>
  );
}

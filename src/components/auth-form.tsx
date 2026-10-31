"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { TranslationKey } from "@/lib/translations";

type AuthMode = "login" | "register" | "reset" | "new-password";

const errorTranslationKeys: Record<string, TranslationKey> = {
  auth_not_configured: "auth.notConfigured",
  verification_failed: "auth.verificationFailed",
};

export default function AuthForm({
  mode,
  errorCode,
}: {
  mode: AuthMode;
  errorCode?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(
    errorCode
      ? t(errorTranslationKeys[errorCode] ?? "auth.genericError")
      : "",
  );
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setSuccess(false);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const client = createSupabaseBrowserClient();
    if (!client) {
      setFeedback(t("auth.contactForHelp"));
      setPending(false);
      return;
    }

    try {
      if (mode === "register") {
        const fullName = String(formData.get("fullName") ?? "").trim();
        if (fullName.length < 1 || fullName.length > 120 || password.length < 12) {
          setFeedback(t("auth.invalidRegister"));
          return;
        }

        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (error) {
          setFeedback(error.message);
          return;
        }
        setSuccess(true);
        setFeedback(t("auth.verifyEmail"));
        return;
      }

      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setFeedback(t("auth.signInFailed"));
          return;
        }
        router.replace("/account");
        router.refresh();
        return;
      }

      if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
        });
        if (error) {
          setFeedback(t("auth.resetFailed"));
          return;
        }
        setSuccess(true);
        setFeedback(t("auth.resetSent"));
        return;
      }

      if (password.length < 12) {
        setFeedback(t("auth.passwordShort"));
        return;
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setFeedback(t("auth.passwordFailed"));
        return;
      }
      setSuccess(true);
      setFeedback(t("auth.passwordUpdated"));
    } catch {
      setFeedback(t("auth.requestFailed"));
    } finally {
      setPending(false);
    }
  }

  const showEmail = mode !== "new-password";
  const showPassword = mode === "login" || mode === "register" || mode === "new-password";

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <label>
          {t("auth.fullName")}
          <input autoComplete="name" maxLength={120} name="fullName" required />
        </label>
      )}
      {showEmail && (
        <label>
          {t("auth.email")}
          <input
            autoComplete="email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
      )}
      {showPassword && (
        <label>
          {mode === "new-password" ? t("auth.newPassword") : t("auth.password")}
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "login" ? undefined : 12}
            name="password"
            required
            type="password"
          />
        </label>
      )}
      {feedback && (
        <p
          aria-live="polite"
          className={`form-result form-result-${success ? "success" : "error"}`}
          role={success ? "status" : "alert"}
        >
          {feedback}
        </p>
      )}
      <button className="button button-lime" disabled={pending} type="submit">
        {pending ? t("auth.wait") : authButtonText(mode, t)}
        <span aria-hidden="true">↗</span>
      </button>
      <nav aria-label="Account links" className="auth-links">
        {mode === "login" && (
          <>
            <Link href="/register">{t("auth.createLink")}</Link>
            <Link href="/reset-password">{t("auth.forgot")}</Link>
          </>
        )}
        {mode === "register" && <Link href="/login">{t("auth.already")}</Link>}
        {mode === "reset" && <Link href="/login">{t("auth.back")}</Link>}
        {mode === "new-password" && <Link href="/login">{t("auth.back")}</Link>}
      </nav>
    </form>
  );
}

function authButtonText(
  mode: AuthMode,
  t: (key: TranslationKey) => string,
) {
  switch (mode) {
    case "login":
      return t("auth.signIn");
    case "register":
      return t("auth.create");
    case "reset":
      return t("auth.sendReset");
    case "new-password":
      return t("auth.updatePassword");
  }
}

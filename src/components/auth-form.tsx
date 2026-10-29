"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "register" | "reset" | "new-password";

const messages: Record<string, string> = {
  auth_not_configured: "Member accounts are not configured yet.",
  verification_failed: "The verification link could not be used. Request a new one.",
};

export default function AuthForm({
  mode,
  errorCode,
}: {
  mode: AuthMode;
  errorCode?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(
    errorCode ? messages[errorCode] ?? "Sign-in could not be completed." : "",
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
      setFeedback("Member accounts are not configured. Please contact Lotus Gym.");
      setPending(false);
      return;
    }

    try {
      if (mode === "register") {
        const fullName = String(formData.get("fullName") ?? "").trim();
        if (fullName.length < 1 || fullName.length > 120 || password.length < 12) {
          setFeedback("Enter your name and choose a password with at least 12 characters.");
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
        setFeedback("Check your inbox for a verification link. Staff will activate membership after verification.");
        return;
      }

      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setFeedback("Sign-in failed. Check your email and password, then try again.");
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
          setFeedback("We could not send a password reset email. Try again later.");
          return;
        }
        setSuccess(true);
        setFeedback("If an account exists for that email, a password reset link has been sent.");
        return;
      }

      if (password.length < 12) {
        setFeedback("Choose a password with at least 12 characters.");
        return;
      }
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setFeedback("Your password could not be changed. Request a new reset link and try again.");
        return;
      }
      setSuccess(true);
      setFeedback("Password updated. You can now sign in.");
    } catch {
      setFeedback("The request could not be completed. Please try again.");
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
          Full name
          <input autoComplete="name" maxLength={120} name="fullName" required />
        </label>
      )}
      {showEmail && (
        <label>
          Email
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
          {mode === "new-password" ? "New password" : "Password"}
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
        {pending ? "Please wait…" : authButtonText(mode)}
        <span aria-hidden="true">↗</span>
      </button>
      <nav aria-label="Account links" className="auth-links">
        {mode === "login" && (
          <>
            <Link href="/register">Create member account</Link>
            <Link href="/reset-password">Forgot password?</Link>
          </>
        )}
        {mode === "register" && <Link href="/login">Already have an account? Sign in</Link>}
        {mode === "reset" && <Link href="/login">Back to sign in</Link>}
        {mode === "new-password" && <Link href="/login">Back to sign in</Link>}
      </nav>
    </form>
  );
}

function authButtonText(mode: AuthMode) {
  switch (mode) {
    case "login":
      return "Sign in";
    case "register":
      return "Create account";
    case "reset":
      return "Send reset link";
    case "new-password":
      return "Update password";
  }
}

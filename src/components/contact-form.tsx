"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type ContactFormProps = {
  enabled: boolean;
};

type SubmissionState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ContactForm({ enabled }: ContactFormProps) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmissionState>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: { error?: string } = await response.json();

      if (!response.ok) {
        setResult({
          type: "error",
          message:
            body.error ?? t("contact.form.sendError"),
        });
        return;
      }

      form.reset();
      setResult({
        type: "success",
        message: t("contact.form.success"),
      });
    } catch {
      setResult({
        type: "error",
        message: t("contact.form.connectionError"),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {!enabled && (
        <p className="form-notice">{t("contact.form.unconfigured")}</p>
      )}
      <fieldset disabled={!enabled || pending}>
        <div className="form-grid">
          <label>
            {t("contact.form.name")}
            <input
              autoComplete="name"
              maxLength={100}
              name="name"
              required
            />
          </label>
          <label>
            {t("contact.form.email")}
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
        </div>
        <label>
          {t("contact.form.subject")}
          <input maxLength={160} name="subject" required />
        </label>
        <label>
          {t("contact.form.message")}
          <textarea maxLength={5000} minLength={10} name="message" required rows={5} />
        </label>
        <label className="honeypot" aria-hidden="true">
          {t("contact.form.leaveBlank")}
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
        <button className="button button-lime" type="submit">
          {pending ? t("contact.form.sending") : t("contact.form.send")} <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
      {result && (
        <p
          aria-live="polite"
          className={`form-result form-result-${result.type}`}
          role={result.type === "error" ? "alert" : "status"}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}

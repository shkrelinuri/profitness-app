"use client";

import { FormEvent, useState } from "react";

type ContactFormProps = {
  enabled: boolean;
};

type SubmissionState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ContactForm({ enabled }: ContactFormProps) {
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
            body.error ??
            "Your message could not be sent. Please call Lotus Gym instead.",
        });
        return;
      }

      form.reset();
      setResult({
        type: "success",
        message: "Your message was sent to Lotus Gym. Thank you for getting in touch.",
      });
    } catch {
      setResult({
        type: "error",
        message:
          "We could not reach the contact service. Please call Lotus Gym instead.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {!enabled && (
        <p className="form-notice">
          The online contact form is not configured yet. Please call the gym
          using the number shown on this page.
        </p>
      )}
      <fieldset disabled={!enabled || pending}>
        <div className="form-grid">
          <label>
            Name
            <input
              autoComplete="name"
              maxLength={100}
              name="name"
              required
            />
          </label>
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
        </div>
        <label>
          Subject
          <input maxLength={160} name="subject" required />
        </label>
        <label>
          Message
          <textarea maxLength={5000} minLength={10} name="message" required rows={5} />
        </label>
        <label className="honeypot" aria-hidden="true">
          Leave this field blank
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
        <button className="button button-lime" type="submit">
          {pending ? "Sending…" : "Send message"} <span aria-hidden="true">↗</span>
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

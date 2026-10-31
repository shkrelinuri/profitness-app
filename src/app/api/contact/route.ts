import { getFormspreeFormId } from "@/lib/contact";

type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
};

const MAX_BODY_BYTES = 12_000;

function isContactSubmission(value: unknown): value is ContactSubmission {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.subject === "string" &&
    typeof candidate.message === "string" &&
    (candidate.website === undefined || typeof candidate.website === "string")
  );
}

export async function POST(request: Request) {
  const formId = getFormspreeFormId();
  if (!formId) {
    return Response.json(
      { error: "The online contact form is not configured. Please call the gym." },
      { status: 503 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Your message is too large." }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: "The message could not be read." }, { status: 400 });
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Your message is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Please check the contact form fields." }, { status: 400 });
  }

  if (!isContactSubmission(body)) {
    return Response.json({ error: "Please check the contact form fields." }, { status: 400 });
  }

  if (body.website?.trim()) {
    return Response.json({ error: "The message could not be accepted." }, { status: 400 });
  }

  const name = body.name.trim();
  const email = body.email.trim();
  const subject = body.subject.trim();
  const message = body.message.trim();

  if (
    name.length < 1 ||
    name.length > 100 ||
    /[\r\n]/.test(name) ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    subject.length < 1 ||
    subject.length > 160 ||
    /[\r\n]/.test(subject) ||
    message.length < 10 ||
    message.length > 5000
  ) {
    return Response.json(
      { error: "Please check the name, email, subject, and message fields." },
      { status: 400 },
    );
  }

  let delivery: Response;
  try {
    delivery = await fetch(`https://formspree.io/f/${formId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        _replyto: email,
        _subject: `Lotus Gym website enquiry: ${subject}`,
        subject,
        message,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("Contact message delivery request failed.", error);
    return Response.json(
      { error: "We could not send your message. Please call Lotus Gym." },
      { status: 502 },
    );
  }

  if (!delivery.ok) {
    console.error("Contact message provider rejected the delivery request.", {
      status: delivery.status,
    });
    return Response.json(
      { error: "We could not send your message. Please call Lotus Gym." },
      { status: 502 },
    );
  }

  return Response.json({ sent: true }, { status: 201 });
}

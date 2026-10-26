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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_INBOX;
  const sender = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !recipient || !sender) {
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

  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedSubject = escapeHtml(subject);
  const escapedMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");

  let delivery: Response;
  try {
    delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `Lotus Gym website enquiry: ${subject}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapedName} &lt;${escapedEmail}&gt;</p><p><strong>Subject:</strong> ${escapedSubject}</p><p>${escapedMessage}</p>`,
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/contact", () => {
  it("forwards a validated message to the configured Formspree form", async () => {
    vi.stubEnv("FORMSPREE_FORM_ID", "lotus123");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost",
        },
        body: JSON.stringify({
          name: "Test Member",
          email: "member@example.com",
          subject: "Membership",
          message: "I would like to know more about memberships.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://formspree.io/f/lotus123");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      name: "Test Member",
      email: "member@example.com",
      _replyto: "member@example.com",
      _subject: "Lotus Gym website enquiry: Membership",
      message: "I would like to know more about memberships.",
    });
  });

  it("does not send messages until a valid Formspree form ID is configured", async () => {
    vi.stubEnv("FORMSPREE_FORM_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

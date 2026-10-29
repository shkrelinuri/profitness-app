import { NextResponse } from "next/server";
import { hasSameOrigin, requireGymStaff } from "@/lib/auth/route-guard";
import {
  MaksisoftIntegrationError,
  MaksisoftIntegrationUnavailableError,
  unavailableMaksisoftMembershipService,
} from "@/lib/integrations/maksisoft/membership-service";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const auth = await requireGymStaff();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("memberId" in body) ||
    typeof body.memberId !== "string"
  ) {
    return NextResponse.json({ error: "A member account is required." }, { status: 400 });
  }

  const { data: link, error } = await auth.supabase
    .from("maksisoft_member_links")
    .select("external_member_id,status")
    .eq("member_id", body.memberId)
    .maybeSingle();
  if (error) {
    console.error("Maksisoft member link could not be loaded for sync.", error);
    return NextResponse.json({ error: "Maksisoft member link could not be loaded." }, { status: 500 });
  }
  if (!link || link.status === "revoked") {
    return NextResponse.json({ error: "No active Maksisoft member link exists." }, { status: 404 });
  }

  try {
    await unavailableMaksisoftMembershipService.synchronize(link.external_member_id);
    return NextResponse.json({ synchronized: true });
  } catch (syncError) {
    if (syncError instanceof MaksisoftIntegrationUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Maksisoft synchronization is unavailable. No provider request was made; obtain official integration access first.",
          synchronization: "pending",
        },
        { status: 503 },
      );
    }
    if (syncError instanceof MaksisoftIntegrationError) {
      console.error("Maksisoft membership synchronization failed.", {
        retryable: syncError.retryable,
        message: syncError.message,
      });
      return NextResponse.json(
        { error: "Maksisoft synchronization failed after the configured retry policy." },
        { status: 502 },
      );
    }
    console.error("Unexpected Maksisoft membership synchronization error.", syncError);
    return NextResponse.json({ error: "Maksisoft synchronization failed." }, { status: 502 });
  }
}

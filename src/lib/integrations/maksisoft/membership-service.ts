export const maksisoftPrivileges = [
  "dashboard",
  "membership_details",
  "class_bookings",
  "workout_plans",
  "account_settings",
] as const;

export type MaksisoftMembershipStatus =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "cancelled";

export type MaksisoftMembershipSnapshot = {
  status: MaksisoftMembershipStatus;
  startsAt: string;
  expiresAt: string | null;
  privileges: readonly string[];
  sourceRevision?: string;
};

export type MaksisoftMembershipAdapter = {
  readonly available: boolean;
  fetchMembership(externalMemberId: string): Promise<MaksisoftMembershipSnapshot>;
};

export type MaksisoftMembershipWriter = (
  externalMemberId: string,
  snapshot: MaksisoftMembershipSnapshot,
  snapshotFingerprint: string,
) => Promise<void>;

export class MaksisoftIntegrationError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "MaksisoftIntegrationError";
  }
}

export class MaksisoftIntegrationUnavailableError extends MaksisoftIntegrationError {
  constructor() {
    super("Maksisoft synchronization is unavailable until an authorized integration is configured.");
    this.name = "MaksisoftIntegrationUnavailableError";
  }
}

export class UnconfiguredMaksisoftAdapter implements MaksisoftMembershipAdapter {
  readonly available = false;

  async fetchMembership(): Promise<MaksisoftMembershipSnapshot> {
    throw new MaksisoftIntegrationUnavailableError();
  }
}

export class MaksisoftMembershipService {
  constructor(
    private readonly adapter: MaksisoftMembershipAdapter,
    private readonly writer?: MaksisoftMembershipWriter,
    private readonly retry: (attempt: number) => Promise<void> = (attempt) =>
      new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** (attempt - 1), 2_000))),
    private readonly maxAttempts = 3,
  ) {}

  async synchronize(externalMemberId: string): Promise<void> {
    const writer = this.writer;
    if (!this.adapter.available || !writer) {
      throw new MaksisoftIntegrationUnavailableError();
    }

    const snapshot = await this.withRetry(() => this.adapter.fetchMembership(externalMemberId));
    const snapshotFingerprint = fingerprintSnapshot(snapshot);
    await this.withRetry(() =>
      writer(externalMemberId, snapshot, snapshotFingerprint),
    );
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (
          !(error instanceof MaksisoftIntegrationError) ||
          !error.retryable ||
          attempt >= this.maxAttempts
        ) {
          throw error;
        }
        await this.retry(attempt);
      }
    }
  }
}

export const unavailableMaksisoftMembershipService = new MaksisoftMembershipService(
  new UnconfiguredMaksisoftAdapter(),
);

function fingerprintSnapshot(snapshot: MaksisoftMembershipSnapshot): string {
  validateSnapshot(snapshot);
  const canonical = JSON.stringify({
    status: snapshot.status,
    startsAt: new Date(snapshot.startsAt).toISOString(),
    expiresAt: snapshot.expiresAt ? new Date(snapshot.expiresAt).toISOString() : null,
    privileges: [...new Set(snapshot.privileges)].sort(),
    sourceRevision: snapshot.sourceRevision ?? null,
  });
  return createSha256(canonical);
}

function validateSnapshot(snapshot: MaksisoftMembershipSnapshot): void {
  if (!["pending", "active", "suspended", "expired", "cancelled"].includes(snapshot.status)) {
    throw new MaksisoftIntegrationError("The provider returned an unsupported membership status.");
  }
  const startsAt = Date.parse(snapshot.startsAt);
  const expiresAt = snapshot.expiresAt === null ? null : Date.parse(snapshot.expiresAt);
  if (
    !Number.isFinite(startsAt) ||
    (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= startsAt))
  ) {
    throw new MaksisoftIntegrationError("The provider returned invalid membership dates.");
  }
  const allowedPrivileges = new Set<string>(maksisoftPrivileges);
  if (snapshot.privileges.some((privilege) => !allowedPrivileges.has(privilege))) {
    throw new MaksisoftIntegrationError("The provider returned an unsupported membership privilege.");
  }
  if (snapshot.sourceRevision && snapshot.sourceRevision.length > 512) {
    throw new MaksisoftIntegrationError("The provider returned an invalid membership revision.");
  }
}

function createSha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";
import {
  MaksisoftIntegrationError,
  MaksisoftIntegrationUnavailableError,
  MaksisoftMembershipService,
  UnconfiguredMaksisoftAdapter,
  type MaksisoftMembershipAdapter,
  type MaksisoftMembershipSnapshot,
} from "./membership-service";

const activeSnapshot: MaksisoftMembershipSnapshot = {
  status: "active",
  startsAt: "2026-10-01T00:00:00.000Z",
  expiresAt: "2026-11-01T00:00:00.000Z",
  privileges: ["dashboard", "class_bookings"],
  sourceRevision: "revision-1",
};

describe("Maksisoft membership service", () => {
  it("does not make provider calls when no authorized adapter is configured", async () => {
    const adapter = new UnconfiguredMaksisoftAdapter();
    const fetch = vi.spyOn(adapter, "fetchMembership");
    const service = new MaksisoftMembershipService(adapter);

    await expect(service.synchronize("external-123")).rejects.toBeInstanceOf(
      MaksisoftIntegrationUnavailableError,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries retryable provider failures before persisting a verified snapshot", async () => {
    const fetchMembership = vi
      .fn<() => Promise<MaksisoftMembershipSnapshot>>()
      .mockRejectedValueOnce(new MaksisoftIntegrationError("Temporary failure", true))
      .mockResolvedValueOnce(activeSnapshot);
    const adapter: MaksisoftMembershipAdapter = {
      available: true,
      fetchMembership,
    };
    const writer = vi.fn().mockResolvedValue(undefined);
    const retry = vi.fn().mockResolvedValue(undefined);
    const service = new MaksisoftMembershipService(adapter, writer, retry, 3);

    await service.synchronize("external-123");

    expect(fetchMembership).toHaveBeenCalledTimes(2);
    expect(retry).toHaveBeenCalledOnce();
    expect(writer).toHaveBeenCalledWith(
      "external-123",
      activeSnapshot,
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("does not retry non-retryable or invalid provider snapshots", async () => {
    const fetchMembership = vi
      .fn<() => Promise<MaksisoftMembershipSnapshot>>()
      .mockRejectedValue(new MaksisoftIntegrationError("Invalid response"));
    const adapter: MaksisoftMembershipAdapter = {
      available: true,
      fetchMembership,
    };
    const writer = vi.fn();
    const retry = vi.fn().mockResolvedValue(undefined);
    const service = new MaksisoftMembershipService(adapter, writer, retry, 3);

    await expect(service.synchronize("external-123")).rejects.toThrow("Invalid response");
    expect(fetchMembership).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    expect(writer).not.toHaveBeenCalled();

    fetchMembership.mockResolvedValue({
      ...activeSnapshot,
      privileges: ["unrecognized-privilege"],
    });
    await expect(service.synchronize("external-123")).rejects.toThrow(
      "unsupported membership privilege",
    );
    expect(writer).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import {
  canManageGymMembers,
  evaluateCardAssignment,
  evaluateMembershipAccess,
  type MembershipRecord,
} from "./membership-authorization";

const now = new Date("2026-10-26T12:00:00.000Z");

function membership(overrides: Partial<MembershipRecord> = {}): MembershipRecord {
  return {
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2027-01-01T00:00:00.000Z",
    suspended: false,
    privileges: ["dashboard", "class_bookings"],
    ...overrides,
  };
}

describe("membership authorization", () => {
  it("allows an active, in-date membership only for an included privilege", () => {
    expect(evaluateMembershipAccess(membership(), "class_bookings", now)).toEqual({
      allowed: true,
      effectiveStatus: "active",
      reason: "allowed",
    });
    expect(evaluateMembershipAccess(membership(), "workout_plans", now)).toMatchObject({
      allowed: false,
      reason: "privilege_not_included",
    });
  });

  it("denies access before the membership start date", () => {
    expect(
      evaluateMembershipAccess(
        membership({ startsAt: "2026-10-27T00:00:00.000Z" }),
        "class_bookings",
        now,
      ),
    ).toMatchObject({ allowed: false, reason: "membership_not_started" });
  });

  it("denies expired memberships", () => {
    expect(
      evaluateMembershipAccess(
        membership({ expiresAt: "2026-10-26T11:59:59.000Z" }),
        "class_bookings",
        now,
      ),
    ).toMatchObject({
      allowed: false,
      effectiveStatus: "expired",
      reason: "membership_expired",
    });
  });

  it("denies suspended memberships even when their status says active", () => {
    expect(
      evaluateMembershipAccess(
        membership({ suspended: true }),
        "class_bookings",
        now,
      ),
    ).toMatchObject({
      allowed: false,
      effectiveStatus: "suspended",
      reason: "membership_suspended",
    });
  });

  it("denies pending and cancelled memberships", () => {
    expect(
      evaluateMembershipAccess(
        membership({ status: "pending" }),
        "dashboard",
        now,
      ),
    ).toMatchObject({ allowed: false, reason: "membership_not_active" });
    expect(
      evaluateMembershipAccess(
        membership({ status: "cancelled" }),
        "dashboard",
        now,
      ),
    ).toMatchObject({ allowed: false, reason: "membership_not_active" });
  });
});

describe("physical card assignment policy", () => {
  const activeCard = {
    memberId: "member-1",
    identifier: "CARD-100",
    status: "active" as const,
  };

  it("rejects duplicate identifiers, including identifiers on revoked cards", () => {
    expect(
      evaluateCardAssignment(
        [{ ...activeCard, status: "revoked" }],
        "member-2",
        "CARD-100",
        "assign",
      ),
    ).toEqual({ allowed: false, reason: "duplicate_identifier" });
  });

  it("requires explicit replace when a member already has an active card", () => {
    expect(
      evaluateCardAssignment([activeCard], "member-1", "CARD-200", "assign"),
    ).toEqual({ allowed: false, reason: "active_card_exists" });
    expect(
      evaluateCardAssignment([activeCard], "member-1", "CARD-200", "replace"),
    ).toEqual({ allowed: true, reason: "allowed" });
  });

  it("rejects empty, overlong, and control-character identifiers", () => {
    expect(evaluateCardAssignment([], "member-1", "  ", "assign").allowed).toBe(false);
    expect(evaluateCardAssignment([], "member-1", "A".repeat(129), "assign").allowed).toBe(false);
    expect(evaluateCardAssignment([], "member-1", "CARD\n100", "assign").allowed).toBe(false);
  });
});

describe("staff authorization policy", () => {
  it("permits staff and admins but not members or anonymous users", () => {
    expect(canManageGymMembers("staff")).toBe(true);
    expect(canManageGymMembers("admin")).toBe(true);
    expect(canManageGymMembers("member")).toBe(false);
    expect(canManageGymMembers(null)).toBe(false);
  });
});

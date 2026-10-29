export type MembershipState =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "cancelled"
  | "none";

export type MembershipRecord = {
  status: MembershipState;
  startsAt: string;
  expiresAt: string | null;
  suspended: boolean;
  privileges: readonly string[];
};

export type AccessDecision = {
  allowed: boolean;
  effectiveStatus: MembershipState;
  reason:
    | "allowed"
    | "no_membership"
    | "membership_not_active"
    | "membership_not_started"
    | "membership_expired"
    | "membership_suspended"
    | "privilege_not_included";
};

export type CardAssignmentRecord = {
  memberId: string;
  identifier: string;
  status: "active" | "lost" | "revoked" | "replaced";
};

export type CardAssignmentDecision = {
  allowed: boolean;
  reason: "allowed" | "invalid_identifier" | "duplicate_identifier" | "active_card_exists";
};

export function evaluateCardAssignment(
  cards: readonly CardAssignmentRecord[],
  memberId: string,
  identifier: string,
  operation: "assign" | "replace",
): CardAssignmentDecision {
  const normalizedIdentifier = identifier.trim();
  if (
    normalizedIdentifier.length < 1 ||
    normalizedIdentifier.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(normalizedIdentifier)
  ) {
    return { allowed: false, reason: "invalid_identifier" };
  }
  if (cards.some((card) => card.identifier === normalizedIdentifier)) {
    return { allowed: false, reason: "duplicate_identifier" };
  }
  if (
    operation === "assign" &&
    cards.some((card) => card.memberId === memberId && card.status === "active")
  ) {
    return { allowed: false, reason: "active_card_exists" };
  }
  return { allowed: true, reason: "allowed" };
}

export function evaluateMembershipAccess(
  membership: MembershipRecord | null,
  privilege: string,
  now: Date = new Date(),
): AccessDecision {
  if (!membership) {
    return { allowed: false, effectiveStatus: "none", reason: "no_membership" };
  }

  if (membership.suspended || membership.status === "suspended") {
    return {
      allowed: false,
      effectiveStatus: "suspended",
      reason: "membership_suspended",
    };
  }

  if (membership.status !== "active") {
    return {
      allowed: false,
      effectiveStatus: membership.status,
      reason: "membership_not_active",
    };
  }

  const startTime = Date.parse(membership.startsAt);
  if (!Number.isFinite(startTime) || startTime > now.getTime()) {
    return {
      allowed: false,
      effectiveStatus: "active",
      reason: "membership_not_started",
    };
  }

  if (membership.expiresAt) {
    const expirationTime = Date.parse(membership.expiresAt);
    if (!Number.isFinite(expirationTime) || expirationTime <= now.getTime()) {
      return {
        allowed: false,
        effectiveStatus: "expired",
        reason: "membership_expired",
      };
    }
  }

  if (!membership.privileges.includes(privilege)) {
    return {
      allowed: false,
      effectiveStatus: "active",
      reason: "privilege_not_included",
    };
  }

  return { allowed: true, effectiveStatus: "active", reason: "allowed" };
}

export function canManageGymMembers(role: string | null | undefined): boolean {
  return role === "staff" || role === "admin";
}

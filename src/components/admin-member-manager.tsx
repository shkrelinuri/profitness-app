"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type GymMembership = {
  id: string;
  status: string;
  source: "pending" | "maksisoft";
  starts_at: string;
  expires_at: string | null;
  suspended_at: string | null;
  privileges: string[];
};

type MaksisoftLink = {
  external_member_id: string;
  status: "pending" | "verified" | "revoked";
  linked_at: string;
  last_synced_at: string | null;
  last_sync_error: string | null;
};

type AuditLog = {
  id: number;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

type GymMember = {
  user_id: string;
  email: string | null;
  full_name: string;
  role: string;
  membership: GymMembership | null;
  maksisoftLink: MaksisoftLink | null;
  auditLogs: AuditLog[];
};

export default function AdminMemberManager() {
  const [members, setMembers] = useState<GymMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/members?q=${encodeURIComponent(search)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as { members?: GymMember[]; error?: string };
      if (!response.ok) {
        setError(result.error ?? "Member search failed.");
        return;
      }
      setMembers(result.members ?? []);
    } catch {
      setError("Member management service is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMembers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadMembers]);

  async function postJson(path: string, payload: unknown, successMessage: string) {
    setPending(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "The requested change failed.");
        return false;
      }
      setNotice(successMessage);
      await loadMembers();
      return true;
    } catch {
      setError("The member management service is unavailable.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const invited = await postJson(
      "/api/admin/members",
      {
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
      },
      "Invitation sent. The member must verify their email before signing in.",
    );
    if (invited) formElement.reset();
  }

  async function linkMember(
    event: FormEvent<HTMLFormElement>,
    memberId: string,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const externalMemberId = String(form.get("externalMemberId") ?? "").trim();
    if (!externalMemberId) {
      setError("Enter the stable Maksisoft member identifier.");
      return;
    }
    await postJson(
      "/api/admin/maksisoft/link",
      { operation: "link", memberId, externalMemberId },
      "Maksisoft member link saved. Membership verification is still pending.",
    );
  }

  async function revokeLink(member: GymMember) {
    if (!window.confirm(`Revoke the Maksisoft member link for ${member.full_name || member.email}?`)) {
      return;
    }
    await postJson(
      "/api/admin/maksisoft/link",
      { operation: "revoke", memberId: member.user_id },
      "Maksisoft link revoked. Digital membership access is suspended.",
    );
  }

  async function syncMember(memberId: string) {
    await postJson(
      "/api/admin/maksisoft/sync",
      { memberId },
      "Membership information synchronized from Maksisoft.",
    );
  }

  return (
    <section aria-labelledby="admin-members-title" className="admin-manager">
      <div className="admin-member-invite">
        <div>
          <p className="eyebrow">New member</p>
          <h2 id="admin-members-title">Invite member</h2>
        </div>
        <form className="admin-invite-form" onSubmit={inviteMember}>
          <label>
            Full name
            <input maxLength={120} name="fullName" required />
          </label>
          <label>
            Email
            <input maxLength={254} name="email" required type="email" />
          </label>
          <button className="button button-lime" disabled={pending} type="submit">
            Send verification invite
          </button>
        </form>
      </div>

      <div className="admin-search-bar">
        <label>
          Search members
          <input
            maxLength={80}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by member name or email"
            value={search}
          />
        </label>
        <span>{loading ? "Loading…" : `${members.length} member${members.length === 1 ? "" : "s"}`}</span>
      </div>

      {error && <p aria-live="polite" className="form-result form-result-error" role="alert">{error}</p>}
      {notice && <p aria-live="polite" className="form-result form-result-success" role="status">{notice}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="member-empty">No member accounts match this search.</p>
      )}

      <div className="admin-member-list">
        {members.map((member) => (
          <article className="admin-member-card" key={member.user_id}>
            <div className="admin-member-heading">
              <div>
                <span className="footer-label">{member.role.toUpperCase()}</span>
                <h3>{member.full_name || "Name not set"}</h3>
                {member.email && (
                  <a className="admin-member-email" href={`mailto:${member.email}`}>
                    {member.email}
                  </a>
                )}
                <code>{member.user_id}</code>
              </div>
              <span className={`member-status-value status-${member.membership?.status ?? "none"}`}>
                {member.membership?.status ?? "no membership"}
              </span>
            </div>

            <section aria-label="Maksisoft member link" className="admin-maksisoft-link">
              <div className="admin-form-heading">
                <h4>Maksisoft membership link</h4>
                <span>
                  Lotus does not set membership status or privileges. They are verified from
                  Maksisoft only when an authorized connector is available.
                </span>
              </div>
              {member.maksisoftLink && (
                <div className="admin-maksisoft-summary">
                  <span>
                    Link: <strong>{member.maksisoftLink.status}</strong>
                  </span>
                  <span>
                    External member ID: <code>{member.maksisoftLink.external_member_id}</code>
                  </span>
                  <span>
                    Last verified sync:{" "}
                    {member.maksisoftLink.last_synced_at
                      ? new Date(member.maksisoftLink.last_synced_at).toLocaleString()
                      : "not synchronized"}
                  </span>
                </div>
              )}
              <form className="admin-link-card-form" onSubmit={(event) => void linkMember(event, member.user_id)}>
                <label>
                  Stable Maksisoft member identifier
                  <input
                    autoComplete="off"
                    defaultValue={member.maksisoftLink?.external_member_id ?? ""}
                    maxLength={128}
                    name="externalMemberId"
                    required
                  />
                </label>
                <button className="button button-lime" disabled={pending} type="submit">
                  {member.maksisoftLink ? "Update member link" : "Link Maksisoft member"}
                </button>
              </form>
              {member.maksisoftLink?.status !== "revoked" && member.maksisoftLink && (
                <div className="admin-maksisoft-actions">
                  <button
                    className="button button-quiet"
                    disabled={pending}
                    onClick={() => void syncMember(member.user_id)}
                    type="button"
                  >
                    Request membership sync
                  </button>
                  <button
                    className="button button-quiet"
                    disabled={pending}
                    onClick={() => void revokeLink(member)}
                    type="button"
                  >
                    Revoke link
                  </button>
                </div>
              )}
            </section>

            <div className="admin-membership-summary">
              <h4>Verified membership snapshot</h4>
              {member.membership?.source === "maksisoft" && member.maksisoftLink?.status === "verified" ? (
                <>
                  <span>
                    Status: <strong>{member.membership.status}</strong>
                  </span>
                  <span>
                    Starts: {new Date(member.membership.starts_at).toLocaleDateString()}
                  </span>
                  <span>
                    Expires:{" "}
                    {member.membership.expires_at
                      ? new Date(member.membership.expires_at).toLocaleDateString()
                      : "not provided"}
                  </span>
                  <span>
                    Digital privileges:{" "}
                    {member.membership.privileges.length > 0
                      ? member.membership.privileges.join(", ")
                      : "none"}
                  </span>
                </>
              ) : (
                <p className="member-empty">
                  No verified Maksisoft membership data is available. Digital membership access
                  remains disabled.
                </p>
              )}
              {member.maksisoftLink?.last_sync_error && (
                <p className="form-result form-result-error">
                  The last synchronization reported an integration error. Check server logs or
                  contact the integration administrator.
                </p>
              )}
            </div>

            <details className="admin-audit-details">
              <summary>Administrative audit history ({member.auditLogs.length})</summary>
              {member.auditLogs.length === 0 ? (
                <p className="member-empty">No member or integration changes recorded.</p>
              ) : (
                <ul>
                  {member.auditLogs.map((log) => (
                    <li key={log.id}>
                      <strong>{log.action.replaceAll("_", " ")}</strong>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

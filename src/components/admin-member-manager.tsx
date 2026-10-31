"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

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
  const { t } = useLanguage();
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
        setError(result.error ?? t("admin.searchFailed"));
        return;
      }
      setMembers(result.members ?? []);
    } catch {
      setError(t("admin.serviceUnavailable"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

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
        setError(result.error ?? t("admin.changeFailed"));
        return false;
      }
      setNotice(successMessage);
      await loadMembers();
      return true;
    } catch {
      setError(t("admin.serviceUnavailable"));
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
      t("admin.invitationSent"),
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
      setError(t("admin.enterExternalId"));
      return;
    }
    await postJson(
      "/api/admin/maksisoft/link",
      { operation: "link", memberId, externalMemberId },
      t("admin.linkSaved"),
    );
  }

  async function revokeLink(member: GymMember) {
    if (!window.confirm(t("admin.confirmRevoke").replace("{value}", member.full_name || member.email || ""))) {
      return;
    }
    await postJson(
      "/api/admin/maksisoft/link",
      { operation: "revoke", memberId: member.user_id },
      t("admin.revoked"),
    );
  }

  async function syncMember(memberId: string) {
    await postJson(
      "/api/admin/maksisoft/sync",
      { memberId },
      t("admin.synced"),
    );
  }

  return (
    <section aria-labelledby="admin-members-title" className="admin-manager">
      <div className="admin-member-invite">
        <div>
          <p className="eyebrow">{t("admin.newMember")}</p>
          <h2 id="admin-members-title">{t("admin.inviteMember")}</h2>
        </div>
        <form className="admin-invite-form" onSubmit={inviteMember}>
          <label>
            {t("admin.fullName")}
            <input maxLength={120} name="fullName" required />
          </label>
          <label>
            {t("admin.email")}
            <input maxLength={254} name="email" required type="email" />
          </label>
          <button className="button button-lime" disabled={pending} type="submit">
            {t("admin.sendInvite")}
          </button>
        </form>
      </div>

      <div className="admin-search-bar">
        <label>
          {t("admin.search")}
          <input
            maxLength={80}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            value={search}
          />
        </label>
        <span>
          {loading
            ? t("admin.loading")
            : members.length === 1
              ? t("admin.memberCountSingle")
              : t("admin.memberCount").replace("{count}", String(members.length))}
        </span>
      </div>

      {error && <p aria-live="polite" className="form-result form-result-error" role="alert">{error}</p>}
      {notice && <p aria-live="polite" className="form-result form-result-success" role="status">{notice}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="member-empty">{t("admin.noMembers")}</p>
      )}

      <div className="admin-member-list">
        {members.map((member) => (
          <article className="admin-member-card" key={member.user_id}>
            <div className="admin-member-heading">
              <div>
                <span className="footer-label">{member.role.toUpperCase()}</span>
                <h3>{member.full_name || t("admin.nameNotSet")}</h3>
                {member.email && (
                  <a className="admin-member-email" href={`mailto:${member.email}`}>
                    {member.email}
                  </a>
                )}
                <code>{member.user_id}</code>
              </div>
              <span className={`member-status-value status-${member.membership?.status ?? "none"}`}>
                {member.membership?.status ?? t("admin.noMembership")}
              </span>
            </div>

            <section aria-label={t("admin.linkSection")} className="admin-maksisoft-link">
              <div className="admin-form-heading">
                <h4>{t("admin.linkSection")}</h4>
                <span>{t("admin.linkDescription")}</span>
              </div>
              {member.maksisoftLink && (
                <div className="admin-maksisoft-summary">
                  <span>
                    {t("admin.link")} <strong>{member.maksisoftLink.status}</strong>
                  </span>
                  <span>
                    {t("admin.externalId")} <code>{member.maksisoftLink.external_member_id}</code>
                  </span>
                  <span>
                    {t("admin.lastSync")}{" "}
                    {member.maksisoftLink.last_synced_at
                      ? new Date(member.maksisoftLink.last_synced_at).toLocaleString()
                      : t("admin.notSynced")}
                  </span>
                </div>
              )}
              <form className="admin-link-card-form" onSubmit={(event) => void linkMember(event, member.user_id)}>
                <label>
                  {t("admin.stableId")}
                  <input
                    autoComplete="off"
                    defaultValue={member.maksisoftLink?.external_member_id ?? ""}
                    maxLength={128}
                    name="externalMemberId"
                    required
                  />
                </label>
                <button className="button button-lime" disabled={pending} type="submit">
                  {member.maksisoftLink ? t("admin.updateLink") : t("admin.linkMember")}
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
                    {t("admin.requestSync")}
                  </button>
                  <button
                    className="button button-quiet"
                    disabled={pending}
                    onClick={() => void revokeLink(member)}
                    type="button"
                  >
                    {t("admin.revoke")}
                  </button>
                </div>
              )}
            </section>

            <div className="admin-membership-summary">
              <h4>{t("admin.snapshot")}</h4>
              {member.membership?.source === "maksisoft" && member.maksisoftLink?.status === "verified" ? (
                <>
                  <span>
                    {t("admin.status")} <strong>{member.membership.status}</strong>
                  </span>
                  <span>
                    {t("admin.starts")} {new Date(member.membership.starts_at).toLocaleDateString()}
                  </span>
                  <span>
                    {t("admin.expires")}{" "}
                    {member.membership.expires_at
                      ? new Date(member.membership.expires_at).toLocaleDateString()
                      : t("admin.notProvided")}
                  </span>
                  <span>
                    {t("admin.privileges")}{" "}
                    {member.membership.privileges.length > 0
                      ? member.membership.privileges.join(", ")
                      : t("admin.none")}
                  </span>
                </>
              ) : (
                <p className="member-empty">
                  {t("admin.noVerifiedData")}
                </p>
              )}
              {member.maksisoftLink?.last_sync_error && (
                <p className="form-result form-result-error">
                  {t("admin.syncError")}
                </p>
              )}
            </div>

            <details className="admin-audit-details">
              <summary>{t("admin.audit").replace("{count}", String(member.auditLogs.length))}</summary>
              {member.auditLogs.length === 0 ? (
                <p className="member-empty">{t("admin.noChanges")}</p>
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

import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminMemberManager from "@/components/admin-member-manager";

export const metadata: Metadata = {
  title: "Staff member and card management",
  description: "Protected member, membership, card, and audit management.",
};

export const instant = false;

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /> Staff only</p>
          <h1>Staff tools are not configured.</h1>
          <p className="status-description">
            Connect the Supabase project and apply the member-account
            migration to enable secure staff tools.
          </p>
        </div>
      </main>
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /> Staff only</p>
          <h1>Sign in required.</h1>
          <p className="status-description">
            Sign in with an authorized staff account to manage member cards.
          </p>
        </div>
      </main>
    );
  }

  const { data: isStaff, error } = await supabase.rpc("is_gym_staff");
  if (error || isStaff !== true) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /> Staff only</p>
          <h1>Access restricted.</h1>
          <p className="status-description">
            This page is available only to authorized Lotus Gym staff.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <section className="admin-welcome">
        <p className="eyebrow"><span /> Authorized staff</p>
        <h1>
          Member
          <br />
          <em>management.</em>
        </h1>
        <p>
          Invite members, link Lotus accounts to Maksisoft member records, and
          review immutable administrative audit events.
        </p>
        <div className="hardware-pending">
          <strong>Maksisoft membership synchronization: unavailable</strong>
          <span>
            No official API, SDK, integration guide, or credentials are
            configured. Maksisoft remains authoritative for membership and
            physical entry; this site does not contact or control the door.
          </span>
        </div>
      </section>
      <AdminMemberManager />
    </main>
  );
}

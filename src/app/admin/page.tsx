import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
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
          <p className="eyebrow"><span /><LocalizedText id="admin.staffOnly" /></p>
          <h1><LocalizedText id="admin.notConfiguredTitle" /></h1>
          <LocalizedText as="p" className="status-description" id="admin.notConfiguredDescription" />
        </div>
      </main>
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /><LocalizedText id="admin.staffOnly" /></p>
          <h1><LocalizedText id="admin.signInTitle" /></h1>
          <LocalizedText as="p" className="status-description" id="admin.signInDescription" />
        </div>
      </main>
    );
  }

  const { data: isStaff, error } = await supabase.rpc("is_gym_staff");
  if (error || isStaff !== true) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /><LocalizedText id="admin.staffOnly" /></p>
          <h1><LocalizedText id="admin.restrictedTitle" /></h1>
          <LocalizedText as="p" className="status-description" id="admin.restrictedDescription" />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <section className="admin-welcome">
        <p className="eyebrow"><span /><LocalizedText id="admin.authorized" /></p>
        <h1>
          <LocalizedText id="admin.heading" />
          <br />
          <LocalizedText as="em" id="admin.highlight" />
        </h1>
        <LocalizedText as="p" id="admin.description" />
        <div className="hardware-pending">
          <strong><LocalizedText id="admin.syncUnavailable" /></strong>
          <span><LocalizedText id="admin.hardwareNotice" /></span>
        </div>
      </section>
      <AdminMemberManager />
    </main>
  );
}

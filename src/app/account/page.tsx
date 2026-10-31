import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LocalizedText } from "@/components/language-provider";
import MemberTools from "@/components/member-tools";
import { gym } from "@/lib/gym";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Member dashboard",
  description: "Private Lotus Fitness Gym member account and card status.",
};

export const instant = false;

export default async function MemberDashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /><LocalizedText id="account.area" /></p>
          <h1><LocalizedText id="account.setupTitle" /></h1>
          <LocalizedText as="p" className="status-description" id="account.setupDescription" />
        </div>
      </main>
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    redirect("/login");
  }

  const [{ data: profile, error: profileError }, { data: summaryRows, error: summaryError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name,role")
        .eq("user_id", authData.user.id)
        .maybeSingle(),
      supabase.rpc("get_my_access_summary"),
    ]);

  if (profileError || summaryError) {
    console.error("Member dashboard data could not be loaded.", {
      profileError,
      summaryError,
    });
    return (
      <main className="status-page">
        <div className="status-content">
          <p className="eyebrow"><span /><LocalizedText id="account.area" /></p>
          <h1><LocalizedText id="account.incompleteTitle" /></h1>
          <LocalizedText as="p" className="status-description" id="account.incompleteDescription" />
        </div>
      </main>
    );
  }

  const summary = summaryRows?.[0] ?? null;
  const privileges: string[] = summary?.privileges ?? [];
  const verifiedMaksisoftMembership =
    summary?.membership_source === "maksisoft" && summary?.integration_status === "verified";
  const canBookClasses = verifiedMaksisoftMembership && privileges.includes("class_bookings");
  const canViewWorkouts = verifiedMaksisoftMembership && privileges.includes("workout_plans");
  const canEditAccount = verifiedMaksisoftMembership && privileges.includes("account_settings");
  const now = new Date().toISOString();

  const [
    { data: classes, error: classesError },
    { data: reservations, error: reservationsError },
    { data: workouts, error: workoutsError },
  ] = await Promise.all([
    canBookClasses
      ? supabase
          .from("gym_classes")
          .select("id,title,starts_at,capacity")
          .eq("active", true)
          .gt("starts_at", now)
          .order("starts_at", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    canBookClasses
      ? supabase
          .from("class_reservations")
          .select("id,class_id,status,reserved_at")
          .eq("member_id", authData.user.id)
          .order("reserved_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    canViewWorkouts
      ? supabase
          .from("workout_plans")
          .select("id,title,description,created_at")
          .eq("member_id", authData.user.id)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (classesError || reservationsError || workoutsError) {
    console.error("Member features could not be loaded.", {
      classesError,
      reservationsError,
      workoutsError,
    });
  }

  const membershipStatus = summary?.membership_status ?? "none";
  const integrationStatus = summary?.integration_status ?? "unlinked";

  return (
    <main className="member-dashboard">
      <section className="member-welcome">
        <p className="eyebrow"><span /><LocalizedText id="account.privateArea" /></p>
        <h1>
          <LocalizedText id="account.welcome" />
          <br />
          <em>{profile?.full_name || <LocalizedText id="account.memberFallback" />}.</em>
        </h1>
        <LocalizedText as="p" id="account.description" />
      </section>

      <section aria-label="Membership and physical card" className="member-status-grid">
        <article className="member-status-card">
          <span className="footer-label"><LocalizedText id="account.membershipStatus" /></span>
          <strong className={`member-status-value status-${membershipStatus}`}>
            {membershipStatus.replaceAll("_", " ")}
          </strong>
          <span>
            <LocalizedText id={verifiedMaksisoftMembership ? "account.verified" : "account.unverified"} />
          </span>
          {summary?.expires_at && (
            <span>
              <LocalizedText
                id="account.expires"
                value={new Date(summary.expires_at).toLocaleDateString()}
              />
            </span>
          )}
          {!summary?.membership_id && (
            <span><LocalizedText id="account.noMembership" /></span>
          )}
        </article>
        <article className="member-status-card physical-card">
          <span className="footer-label"><LocalizedText id="account.connection" /></span>
          <strong className={`member-status-value status-${integrationStatus}`}>
            {integrationStatus.replaceAll("_", " ")}
          </strong>
          <span>
            {summary?.last_synced_at
              ? <LocalizedText id="account.lastSynced" value={new Date(summary.last_synced_at).toLocaleString()} />
              : <LocalizedText id="account.notSynced" />}
          </span>
        </article>
      </section>

      {(!verifiedMaksisoftMembership || membershipStatus !== "active") && (
        <aside className="member-support-note">
          <LocalizedText id="account.support" />{" "}
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>.
        </aside>
      )}
      <aside className="member-support-note">
        <LocalizedText id="account.integrationPending" />
      </aside>

      <MemberTools
        canBookClasses={canBookClasses && membershipStatus === "active"}
        canEditAccount={canEditAccount && membershipStatus === "active"}
        canViewWorkouts={canViewWorkouts && membershipStatus === "active"}
        classes={classesError ? [] : (classes ?? [])}
        fullName={profile?.full_name ?? ""}
        reservations={reservationsError ? [] : (reservations ?? [])}
        workouts={workoutsError ? [] : (workouts ?? [])}
      />
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type GymClass = {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
};

type Reservation = {
  id: string;
  class_id: string;
  status: "reserved" | "cancelled";
  reserved_at: string;
};

type WorkoutPlan = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export default function MemberTools({
  fullName,
  classes,
  reservations,
  workouts,
  canBookClasses,
  canViewWorkouts,
  canEditAccount,
}: {
  fullName: string;
  classes: GymClass[];
  reservations: Reservation[];
  workouts: WorkoutPlan[];
  canBookClasses: boolean;
  canViewWorkouts: boolean;
  canEditAccount: boolean;
}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [name, setName] = useState(fullName);

  async function reserveClass(classId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage(t("memberTools.notConfigured"));
      return;
    }
    setPending(classId);
    setMessage("");
    const { error } = await client.rpc("reserve_gym_class", { p_class_id: classId });
    if (error) {
      setMessage(t("memberTools.reserveFailed"));
    } else {
      setMessage(t("memberTools.confirmed"));
      router.refresh();
    }
    setPending(null);
  }

  async function cancelReservation(reservationId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage(t("memberTools.notConfigured"));
      return;
    }
    setPending(reservationId);
    setMessage("");
    const { error } = await client.rpc("cancel_gym_class_reservation", {
      p_reservation_id: reservationId,
    });
    if (error) {
      setMessage(t("memberTools.cancelFailed"));
    } else {
      setMessage(t("memberTools.cancelled"));
      router.refresh();
    }
    setPending(null);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage(t("memberTools.notConfigured"));
      return;
    }
    setPending("profile");
    setMessage("");
    const { error } = await client
      .from("profiles")
      .update({ full_name: name.trim() })
      .select("user_id")
      .single();
    if (error) {
      setMessage(t("memberTools.profileFailed"));
    } else {
      setMessage(t("memberTools.profileUpdated"));
      router.refresh();
    }
    setPending(null);
  }

  async function signOut() {
    const client = createSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  }

  const activeReservations = reservations.filter((item) => item.status === "reserved");

  return (
    <>
      <section aria-labelledby="booking-title" className="member-panel">
        <div className="member-panel-heading">
          <div>
            <p className="eyebrow">{t("memberTools.classes")}</p>
            <h2 id="booking-title">{t("memberTools.bookings")}</h2>
          </div>
          <span className="member-panel-count">
            {t("memberTools.reservedCount").replace("{count}", String(activeReservations.length))}
          </span>
        </div>
        {!canBookClasses ? (
          <p className="member-empty">
            {t("memberTools.bookingUnavailable")}
          </p>
        ) : (
          <>
            <div className="member-booking-list">
              {activeReservations.map((reservation) => {
                const gymClass = classes.find((item) => item.id === reservation.class_id);
                return (
                  <article className="member-booking" key={reservation.id}>
                    <div>
                      <strong>{gymClass?.title ?? t("memberTools.reservedClass")}</strong>
                      <span>
                        {gymClass
                          ? new Date(gymClass.starts_at).toLocaleString(language === "sq" ? "sq-AL" : "en-US")
                          : t("memberTools.classUnavailable")}
                      </span>
                    </div>
                    <button
                      className="button button-quiet"
                      disabled={pending === reservation.id}
                      onClick={() => cancelReservation(reservation.id)}
                      type="button"
                    >
                      {t("memberTools.cancel")}
                    </button>
                  </article>
                );
              })}
              {activeReservations.length === 0 && (
                <p className="member-empty">{t("memberTools.noReservations")}</p>
              )}
            </div>
            <div className="member-class-list">
              <h3>{t("memberTools.availableSessions")}</h3>
              {classes.length === 0 && (
                <p className="member-empty">
                  {t("memberTools.noClasses")}
                </p>
              )}
              {classes.map((gymClass) => {
                const isReserved = activeReservations.some(
                  (reservation) => reservation.class_id === gymClass.id,
                );
                return (
                  <article className="member-booking" key={gymClass.id}>
                    <div>
                      <strong>{gymClass.title}</strong>
                      <span>{new Date(gymClass.starts_at).toLocaleString(language === "sq" ? "sq-AL" : "en-US")}</span>
                    </div>
                    <button
                      className="button button-lime"
                      disabled={isReserved || pending === gymClass.id}
                      onClick={() => reserveClass(gymClass.id)}
                      type="button"
                    >
                      {isReserved ? t("memberTools.reserved") : t("memberTools.reserve")}
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="workout-title" className="member-panel">
        <div className="member-panel-heading">
          <div>
            <p className="eyebrow">{t("memberTools.training")}</p>
            <h2 id="workout-title">{t("memberTools.workoutPlans")}</h2>
          </div>
        </div>
        {!canViewWorkouts ? (
          <p className="member-empty">
            {t("memberTools.workoutsUnavailable")}
          </p>
        ) : workouts.length === 0 ? (
          <p className="member-empty">
            {t("memberTools.noWorkouts")}
          </p>
        ) : (
          <div className="workout-list">
            {workouts.map((workout) => (
              <article className="workout-card" key={workout.id}>
                <h3>{workout.title}</h3>
                <p>{workout.description}</p>
                <span>
                  {t("memberTools.assigned").replace(
                    "{value}",
                    new Date(workout.created_at).toLocaleDateString(language === "sq" ? "sq-AL" : "en-US"),
                  )}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="settings-title" className="member-panel" id="account-settings">
        <div className="member-panel-heading">
          <div>
            <p className="eyebrow">{t("memberTools.details")}</p>
            <h2 id="settings-title">{t("memberTools.settings")}</h2>
          </div>
        </div>
        {!canEditAccount ? (
          <p className="member-empty">
            {t("memberTools.settingsUnavailable")}
          </p>
        ) : (
          <form className="member-settings-form" onSubmit={saveProfile}>
            <label>
              {t("memberTools.fullName")}
              <input
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <button className="button button-lime" disabled={pending === "profile"} type="submit">
              {t("memberTools.save")}
            </button>
          </form>
        )}
        <button className="button button-quiet member-signout" onClick={signOut} type="button">
          {t("memberTools.signOut")}
        </button>
      </section>
      {message && <p aria-live="polite" className="member-feedback" role="status">{message}</p>}
    </>
  );
}

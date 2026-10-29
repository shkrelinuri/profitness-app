"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [name, setName] = useState(fullName);

  async function reserveClass(classId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage("Member services are not configured.");
      return;
    }
    setPending(classId);
    setMessage("");
    const { error } = await client.rpc("reserve_gym_class", { p_class_id: classId });
    if (error) {
      setMessage("Reservation failed. Check your membership and class availability.");
    } else {
      setMessage("Your class reservation is confirmed.");
      router.refresh();
    }
    setPending(null);
  }

  async function cancelReservation(reservationId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage("Member services are not configured.");
      return;
    }
    setPending(reservationId);
    setMessage("");
    const { error } = await client.rpc("cancel_gym_class_reservation", {
      p_reservation_id: reservationId,
    });
    if (error) {
      setMessage("The reservation could not be cancelled.");
    } else {
      setMessage("Reservation cancelled.");
      router.refresh();
    }
    setPending(null);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage("Member services are not configured.");
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
      setMessage("Profile changes could not be saved.");
    } else {
      setMessage("Profile updated.");
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
            <p className="eyebrow">Your classes</p>
            <h2 id="booking-title">Bookings</h2>
          </div>
          <span className="member-panel-count">{activeReservations.length} reserved</span>
        </div>
        {!canBookClasses ? (
          <p className="member-empty">
            Class booking is not included in your current membership. Contact
            Lotus Gym if you think this is incorrect.
          </p>
        ) : (
          <>
            <div className="member-booking-list">
              {activeReservations.map((reservation) => {
                const gymClass = classes.find((item) => item.id === reservation.class_id);
                return (
                  <article className="member-booking" key={reservation.id}>
                    <div>
                      <strong>{gymClass?.title ?? "Reserved class"}</strong>
                      <span>
                        {gymClass
                          ? new Date(gymClass.starts_at).toLocaleString()
                          : "Class details are not available"}
                      </span>
                    </div>
                    <button
                      className="button button-quiet"
                      disabled={pending === reservation.id}
                      onClick={() => cancelReservation(reservation.id)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </article>
                );
              })}
              {activeReservations.length === 0 && (
                <p className="member-empty">You have no upcoming class reservations.</p>
              )}
            </div>
            <div className="member-class-list">
              <h3>Available sessions</h3>
              {classes.length === 0 && (
                <p className="member-empty">
                  No upcoming classes have been published by the gym.
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
                      <span>{new Date(gymClass.starts_at).toLocaleString()}</span>
                    </div>
                    <button
                      className="button button-lime"
                      disabled={isReserved || pending === gymClass.id}
                      onClick={() => reserveClass(gymClass.id)}
                      type="button"
                    >
                      {isReserved ? "Reserved" : "Reserve"}
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
            <p className="eyebrow">Your training</p>
            <h2 id="workout-title">Workout plans</h2>
          </div>
        </div>
        {!canViewWorkouts ? (
          <p className="member-empty">
            Workout plans are not included in your current membership.
          </p>
        ) : workouts.length === 0 ? (
          <p className="member-empty">
            No workout plans have been assigned to your account yet.
          </p>
        ) : (
          <div className="workout-list">
            {workouts.map((workout) => (
              <article className="workout-card" key={workout.id}>
                <h3>{workout.title}</h3>
                <p>{workout.description}</p>
                <span>Assigned {new Date(workout.created_at).toLocaleDateString()}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="settings-title" className="member-panel" id="account-settings">
        <div className="member-panel-heading">
          <div>
            <p className="eyebrow">Your details</p>
            <h2 id="settings-title">Account settings</h2>
          </div>
        </div>
        {!canEditAccount ? (
          <p className="member-empty">
            Account settings are not available under the current membership privileges.
          </p>
        ) : (
          <form className="member-settings-form" onSubmit={saveProfile}>
            <label>
              Full name
              <input
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <button className="button button-lime" disabled={pending === "profile"} type="submit">
              Save profile
            </button>
          </form>
        )}
        <button className="button button-quiet member-signout" onClick={signOut} type="button">
          Sign out
        </button>
      </section>
      {message && <p aria-live="polite" className="member-feedback" role="status">{message}</p>}
    </>
  );
}

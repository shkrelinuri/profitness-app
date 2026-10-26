import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Contact Lotus Gym in Tirana to confirm opening times and class schedules.",
};

export default function SchedulePage() {
  return (
    <StatusPage
      eyebrow="Plan your visit"
      title="Schedule"
      description="Opening times and class information can change. Please check directly with the gym."
      notice="Only a 10:00 PM closing time was visible in the supplied listing. Opening hours, weekly schedules, and class times have not been confirmed. Call before visiting."
      actionHref="tel:+355693055396"
      actionLabel="Call +355 69 305 5396"
    />
  );
}

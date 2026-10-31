import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Lotus Gym is open Monday to Saturday from 9:00 AM to 11:00 PM and Sunday from 9:00 AM to 4:00 PM. Contact the gym for class schedules.",
};

export default function SchedulePage() {
  return (
    <StatusPage
      eyebrow={<LocalizedText id="schedule.kicker" />}
      title={<LocalizedText id="schedule.title" />}
      description={<LocalizedText id="schedule.description" />}
      notice={<LocalizedText id="schedule.notice" />}
      actionHref="tel:+355693055396"
      actionLabel={<LocalizedText id="status.call" />}
    />
  );
}

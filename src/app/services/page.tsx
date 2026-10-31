import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Ask Lotus Gym in Tirana about currently available training services.",
};

export default function ServicesPage() {
  return (
    <StatusPage
      eyebrow={<LocalizedText id="services.kicker" />}
      title={<LocalizedText id="services.title" />}
      description={<LocalizedText id="services.description" />}
      notice={<LocalizedText id="services.notice" />}
    />
  );
}

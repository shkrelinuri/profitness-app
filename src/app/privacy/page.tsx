import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Privacy information",
  description:
    "Privacy information for the Lotus Fitness Gym website.",
};

export default function PrivacyPage() {
  return (
    <StatusPage
      eyebrow={<LocalizedText id="privacy.kicker" />}
      title={<LocalizedText id="privacy.title" />}
      description={<LocalizedText id="privacy.description" />}
      notice={<LocalizedText id="privacy.notice" />}
      actionHref="/contact"
      actionLabel={<LocalizedText id="privacy.action" />}
    />
  );
}

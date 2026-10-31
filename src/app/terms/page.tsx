import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the Lotus Fitness Gym website.",
};

export default function TermsPage() {
  return (
    <StatusPage
      eyebrow={<LocalizedText id="terms.kicker" />}
      title={<LocalizedText id="terms.title" />}
      description={<LocalizedText id="terms.description" />}
      notice={<LocalizedText id="terms.notice" />}
      actionHref="tel:+355693055396"
      actionLabel={<LocalizedText id="status.call" />}
    />
  );
}

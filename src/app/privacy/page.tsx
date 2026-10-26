import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Privacy information",
  description:
    "Privacy information for the Lotus Fitness Gym website.",
};

export default function PrivacyPage() {
  return (
    <StatusPage
      eyebrow="Privacy"
      title="Privacy information"
      description="A complete privacy policy has not yet been provided by Lotus Gym."
      notice="Do not submit sensitive personal information through this website. The optional contact form is unavailable until a verified delivery inbox and sender are configured. A formal privacy notice must be approved before collecting member or contact data."
      actionHref="/contact"
      actionLabel="View contact details"
    />
  );
}

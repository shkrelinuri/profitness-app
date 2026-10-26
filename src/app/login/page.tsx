import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Member login",
  description: "Member login for Lotus Fitness Gym is not yet available.",
};

export default function LoginPage() {
  return (
    <StatusPage
      eyebrow="Member area"
      title="Member login"
      description="Online member accounts are not yet set up for Lotus Gym."
      notice="There is no authentication service connected to this website. We will not ask you to create an account or enter a password here. Please contact the gym for membership support."
      actionHref="tel:+355693055396"
      actionLabel="Call +355 69 305 5396"
    />
  );
}

import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Ask Lotus Gym in Tirana about currently available training services.",
};

export default function ServicesPage() {
  return (
    <StatusPage
      eyebrow="Explore Lotus"
      title="Services"
      description="We want you to have accurate information before you visit."
      notice="Lotus Gym has not yet provided a verified list of services or facilities for this website. Call the gym to ask what is currently available."
    />
  );
}

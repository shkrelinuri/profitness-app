import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "Contact Lotus Gym in Tirana for current membership options and prices.",
};

export default function MembershipsPage() {
  return (
    <StatusPage
      eyebrow="Join Lotus"
      title="Memberships"
      description="Find out which membership options are currently available."
      notice="Membership plans, prices, terms, and payment options have not been supplied or configured. Call Lotus Gym directly for current details. No payment or membership purchase is available on this website."
      actionHref="tel:+355693055396"
      actionLabel="Call +355 69 305 5396"
    />
  );
}

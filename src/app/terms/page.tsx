import type { Metadata } from "next";
import StatusPage from "@/components/status-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the Lotus Fitness Gym website.",
};

export default function TermsPage() {
  return (
    <StatusPage
      eyebrow="Terms"
      title="Terms of use"
      description="Website terms have not yet been supplied by Lotus Gym."
      notice="Membership terms, pricing, and facility rules are not published here. Contact the gym directly for current information. Formal website terms should be reviewed and approved before launch."
      actionHref="tel:+355693055396"
      actionLabel="Call +355 69 305 5396"
    />
  );
}

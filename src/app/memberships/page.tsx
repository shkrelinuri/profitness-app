import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/language-provider";
import PlanInquiryLink from "@/components/plan-inquiry-link";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "Compare Lotus Fitness Gym monthly membership prices in Albanian lek.",
};

const plans = [
  { visits: 3, men: 4500 },
  { visits: 4, men: 5000 },
  { visits: 5, men: 5500 },
  { visits: 7, men: 6000 },
];

function formatLek(amount: number) {
  return `${amount.toLocaleString("en-US")} LEK`;
}

export default function MembershipsPage() {
  return (
    <main className="pricing-page">
      <section aria-labelledby="membership-title" className="pricing-hero">
        <p className="eyebrow"><span /><LocalizedText id="memberships.kicker" /></p>
        <h1 id="membership-title">
          <LocalizedText id="memberships.heading" />
          <br />
          <LocalizedText as="em" id="memberships.highlight" />
        </h1>
        <LocalizedText as="p" className="pricing-intro" id="memberships.intro" />
      </section>

      <section aria-label="Monthly membership plans" className="pricing-grid">
        {plans.map((plan) => (
          <article className="pricing-card" key={plan.visits}>
            <p className="pricing-frequency">
              <LocalizedText count={plan.visits} id="memberships.days" />
            </p>
            <h2>{plan.visits}×</h2>
            <LocalizedText
              as="p"
              className="pricing-frequency-caption"
              id="memberships.visits"
            />
            <div className="pricing-divider" />
            <div className="pricing-gender">
              <LocalizedText id="memberships.men" />
              <strong>{formatLek(plan.men)}</strong>
              <small><LocalizedText id="memberships.perMonth" /></small>
            </div>
            <div className="pricing-gender pricing-gender-women">
              <LocalizedText id="memberships.women" />
              <strong>{formatLek(plan.men - 500)}</strong>
              <small><LocalizedText id="memberships.perMonth" /></small>
            </div>
            <PlanInquiryLink />
          </article>
        ))}
      </section>

      <section aria-label="Membership details" className="pricing-details">
        <div className="pricing-card-fee">
          <span aria-hidden="true" className="pricing-card-icon">01</span>
          <div>
            <LocalizedText as="p" className="footer-label" id="memberships.required" />
            <h2><LocalizedText id="memberships.card" /></h2>
            <p><LocalizedText id="memberships.cardDescription" /></p>
          </div>
          <strong>{formatLek(500)}</strong>
        </div>
        <LocalizedText as="p" className="pricing-note" id="memberships.note" />
        <Link className="button button-outline" href="tel:+355693055396">
          <LocalizedText id="memberships.call" /> <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}

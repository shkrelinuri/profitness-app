import type { Metadata } from "next";
import Link from "next/link";
import { LocalizedText } from "@/components/language-provider";
import { gym } from "@/lib/gym";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn where to find Lotus Gym, a fitness center in central Tirana, Albania.",
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="eyebrow"><span /><LocalizedText id="home.kicker" /></p>
        <h1>
          <LocalizedText id="about.heading" />
          <br />
          <LocalizedText as="em" id="about.highlight" />
        </h1>
        <LocalizedText as="p" id="about.description" />
        <Link className="button button-lime" href="/contact">
          <LocalizedText id="about.find" /> <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="about-facts">
        <div>
          <span className="footer-label"><LocalizedText id="about.location" /></span>
          <p>{gym.address.full}</p>
        </div>
        <div>
          <span className="footer-label"><LocalizedText id="contact.phone" /></span>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
        </div>
        <div>
          <span className="footer-label"><LocalizedText id="about.category" /></span>
          <p><LocalizedText id="about.categoryName" /></p>
        </div>
      </section>
    </main>
  );
}

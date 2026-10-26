import type { Metadata } from "next";
import Link from "next/link";
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
        <p className="eyebrow"><span /> {gym.category} · Tirana, Albania</p>
        <h1>
          A new
          <br />
          <em>start begins here.</em>
        </h1>
        <p>
          Lotus Gym is located on Bulevardi Zogu I in central Tirana. For
          current information about training and memberships, speak with the
          team directly.
        </p>
        <Link className="button button-lime" href="/contact">
          Find Lotus Gym <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="about-facts">
        <div>
          <span className="footer-label">LOCATION</span>
          <p>{gym.address.full}</p>
        </div>
        <div>
          <span className="footer-label">PHONE</span>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
        </div>
        <div>
          <span className="footer-label">BUSINESS CATEGORY</span>
          <p>{gym.category}</p>
        </div>
      </section>
    </main>
  );
}

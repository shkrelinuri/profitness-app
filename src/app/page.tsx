import Link from "next/link";
import { gym } from "@/lib/gym";

export default function Home() {
  return (
    <main>
      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {gym.category} · Tirana, Albania</p>
          <h1 id="hero-title">
            Make room
            <br />
            for <em>strong.</em>
          </h1>
          <p className="hero-description">
            Your fitness journey starts with a first step. Find Lotus Gym in
            central Tirana and speak with the team about what is available.
          </p>
          <div className="hero-actions">
            <Link className="button button-lime" href="/memberships">
              Join Lotus Fitness <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/services">
              Explore services <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-location">
            <span className="location-pin" aria-hidden="true">◎</span>
            <span>
              <strong>Central Tirana</strong>
              <span>Bulevardi Zogu I 1</span>
            </span>
          </div>
        </div>
        <div aria-label="Illustrative fitness photography" className="hero-image" role="img">
          <div className="hero-image-note">
            <span className="caption-dot" />
            <span>Lotus Gym · Tirana</span>
          </div>
          <div className="hero-image-stamp" aria-hidden="true">
            <span>MOVE</span>
            <span>WITH</span>
            <strong>✳</strong>
            <span>INTENTION</span>
          </div>
        </div>
        <div aria-hidden="true" className="hero-index">01 — YOUR NEXT STEP</div>
      </section>

      <section aria-label="Gym information" className="facts-strip">
        <div>
          <span className="fact-label">FIND US</span>
          <span>Bulevardi Zogu I 1, Tirana</span>
        </div>
        <div>
          <span className="fact-label">CALL THE GYM</span>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
        </div>
        <div>
          <span className="fact-label">HOURS</span>
          <span>Call to confirm · listed close 10:00 PM</span>
        </div>
        <a className="fact-map-link" href={gym.mapsUrl} rel="noreferrer" target="_blank">
          Get directions <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section aria-labelledby="start-title" className="intro-section">
        <div className="intro-heading">
          <p className="eyebrow">A place to begin</p>
          <h2 id="start-title">
            Your goals.
            <br />
            <em>Your next move.</em>
          </h2>
        </div>
        <div className="intro-copy">
          <p>
            Lotus Gym is a fitness center on Bulevardi Zogu I in Tirana. For
            the most accurate information about available training, current
            memberships, and visiting hours, contact the gym directly.
          </p>
          <Link className="text-link" href="/about">
            Get to know Lotus <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="services-title" className="services-section">
        <div className="section-topline">
          <p className="eyebrow">Explore Lotus</p>
          <span>01 / 03</span>
        </div>
        <div className="services-heading">
          <h2 id="services-title">
            Start with
            <br />
            <em>a conversation.</em>
          </h2>
          <p>
            Current services, membership options, and class times have not
            been confirmed for publication. The team can tell you what is
            available today.
          </p>
        </div>
        <div className="service-links">
          <Link href="/services">
            <span>01</span><strong>Services</strong><span>See confirmed details</span><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/memberships">
            <span>02</span><strong>Memberships</strong><span>Ask about joining</span><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/schedule">
            <span>03</span><strong>Schedule</strong><span>Confirm times by phone</span><b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>

      {gym.rating.visible && (
      <section aria-labelledby="rating-title" className="rating-section">
        <div className="rating-mark" aria-hidden="true">✳</div>
        <div>
          <p className="eyebrow">A note from the supplied listing</p>
          <h2 id="rating-title">
            {gym.rating.value.toFixed(1)} <span className="rating-out-of">/ 5</span>
          </h2>
          <p className="rating-caption">
            {gym.rating.reviewCount} reviews · {gym.rating.sourceNote}
          </p>
        </div>
        <Link className="text-link" href="/contact">
          Visit Lotus Gym <span aria-hidden="true">→</span>
        </Link>
      </section>
      )}

      <section aria-labelledby="visit-title" className="visit-section" id="visit">
        <div>
          <p className="eyebrow">Find your way here</p>
          <h2 id="visit-title">
            See you in
            <br />
            <em>Tirana.</em>
          </h2>
          <p className="visit-copy">
            Find Lotus Gym at Qendra Trektare Tirana. Call ahead to confirm
            opening hours before making your visit.
          </p>
          <a className="button button-lime" href={gym.mapsUrl} rel="noreferrer" target="_blank">
            Directions in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="visit-card">
          <span className="footer-label">LOTUS GYM · TIRANA</span>
          <address>
            {gym.address.street}
            <br />
            {gym.address.building}
            <br />
            {gym.address.city}, {gym.address.postalCode}, {gym.address.country}
          </address>
          <a className="visit-phone" href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
          <span className="plus-code">PLUS CODE&nbsp; {gym.plusCode}</span>
          <span className="hours-note">{gym.hoursNote}</span>
        </div>
      </section>
    </main>
  );
}

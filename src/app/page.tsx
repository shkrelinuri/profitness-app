import Link from "next/link";
import { LocalizedText } from "@/components/language-provider";
import { gym } from "@/lib/gym";

export default function Home() {
  return (
    <main>
      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /><LocalizedText id="home.kicker" /></p>
          <h1 id="hero-title">
            <LocalizedText id="home.hero.first" />
            <br />
            <LocalizedText id="home.hero.second" />{" "}
            <LocalizedText as="em" id="home.hero.highlight" />
          </h1>
          <LocalizedText as="p" className="hero-description" id="home.hero.description" />
          <div className="hero-actions">
            <Link className="button button-lime" href="/memberships">
              <LocalizedText id="home.join" /> <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/services">
              <LocalizedText id="home.explore" /> <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-location">
            <span className="location-pin" aria-hidden="true">◎</span>
            <span>
              <strong><LocalizedText id="home.central" /></strong>
              <span><LocalizedText id="home.location" /></span>
            </span>
          </div>
        </div>
        <div aria-label="Illustrative fitness photography" className="hero-image" role="img">
          <div className="hero-image-note">
            <span className="caption-dot" />
            <span><LocalizedText id="home.photo" /></span>
          </div>
          <div className="hero-image-stamp" aria-hidden="true">
            <span><LocalizedText id="home.motto.move" /></span>
            <span><LocalizedText id="home.motto.with" /></span>
            <strong>✳</strong>
            <span><LocalizedText id="home.motto.intention" /></span>
          </div>
        </div>
        <div aria-hidden="true" className="hero-index"><LocalizedText id="home.index" /></div>
      </section>

      <section aria-label="Gym information" className="facts-strip">
        <div>
          <span className="fact-label"><LocalizedText id="home.find" /></span>
          <span><LocalizedText id="home.address" /></span>
        </div>
        <div>
          <span className="fact-label"><LocalizedText id="home.call" /></span>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
        </div>
        <div>
          <span className="fact-label"><LocalizedText id="home.hours" /></span>
          <span><LocalizedText id="footer.hours" /></span>
        </div>
        <a className="fact-map-link" href={gym.mapsUrl} rel="noreferrer" target="_blank">
          <LocalizedText id="home.directions" /> <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section aria-labelledby="start-title" className="intro-section">
        <div className="intro-heading">
          <p className="eyebrow"><LocalizedText id="home.intro.kicker" /></p>
          <h2 id="start-title">
            <LocalizedText id="home.intro.first" />
            <br />
            <LocalizedText as="em" id="home.intro.second" />
          </h2>
        </div>
        <div className="intro-copy">
          <LocalizedText as="p" id="home.intro.description" />
          <Link className="text-link" href="/about">
            <LocalizedText id="home.about" /> <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="services-title" className="services-section">
        <div className="section-topline">
          <p className="eyebrow"><LocalizedText id="home.explore.kicker" /></p>
          <span>01 / 03</span>
        </div>
        <div className="services-heading">
          <h2 id="services-title">
            <LocalizedText id="home.explore.heading" />
            <br />
            <LocalizedText as="em" id="home.explore.highlight" />
          </h2>
          <LocalizedText as="p" id="home.explore.description" />
        </div>
        <div className="service-links">
          <Link href="/services">
            <span>01</span><strong><LocalizedText id="home.services" /></strong><span><LocalizedText id="home.services.caption" /></span><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/memberships">
            <span>02</span><strong><LocalizedText id="home.memberships" /></strong><span><LocalizedText id="home.memberships.caption" /></span><b aria-hidden="true">↗</b>
          </Link>
          <Link href="/schedule">
            <span>03</span><strong><LocalizedText id="home.schedule" /></strong><span><LocalizedText id="home.schedule.caption" /></span><b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>

      {gym.rating.visible && (
      <section aria-labelledby="rating-title" className="rating-section">
        <div className="rating-mark" aria-hidden="true">✳</div>
        <div>
          <p className="eyebrow"><LocalizedText id="home.rating.kicker" /></p>
          <h2 id="rating-title">
            {gym.rating.value.toFixed(1)} <span className="rating-out-of">/ 5</span>
          </h2>
          <p className="rating-caption">
            <LocalizedText count={gym.rating.reviewCount} id="home.rating.note" />
          </p>
        </div>
        <Link className="text-link" href="/contact">
          <LocalizedText id="home.visit" /> <span aria-hidden="true">→</span>
        </Link>
      </section>
      )}

      <section aria-labelledby="visit-title" className="visit-section" id="visit">
        <div>
          <p className="eyebrow"><LocalizedText id="home.visit.kicker" /></p>
          <h2 id="visit-title">
            <LocalizedText id="home.visit.first" />
            <br />
            <LocalizedText as="em" id="home.visit.highlight" />
          </h2>
          <LocalizedText as="p" className="visit-copy" id="home.visit.description" />
          <a className="button button-lime" href={gym.mapsUrl} rel="noreferrer" target="_blank">
            <LocalizedText id="contact.directions" /> <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="visit-card">
          <span className="footer-label"><LocalizedText id="home.gym" /></span>
          <address>
            {gym.address.street}
            <br />
            {gym.address.building}
            <br />
            {gym.address.city}, {gym.address.postalCode}, {gym.address.country}
          </address>
          <a className="visit-phone" href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
          <span className="hours-note">{gym.hoursNote}</span>
        </div>
      </section>
    </main>
  );
}

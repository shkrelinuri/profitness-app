import type { Metadata } from "next";
import ContactForm from "@/components/contact-form";
import { gym } from "@/lib/gym";

export const metadata: Metadata = {
  title: "Contact and location",
  description:
    "Contact Lotus Gym in Tirana. View the verified address, phone number, Plus Code, and map directions.",
};

const mapsSearch = `${gym.address.full} ${gym.plusCode}`;
const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapsSearch)}&output=embed`;
const contactFormConfigured = Boolean(
  process.env.RESEND_API_KEY &&
    process.env.CONTACT_INBOX &&
    process.env.CONTACT_FROM_EMAIL,
);

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-heading">
        <p className="eyebrow"><span /> We&apos;re in Tirana</p>
        <h1>
          Come find
          <br />
          <em>Lotus Gym.</em>
        </h1>
        <p>
          Call us to confirm opening times or ask about current membership
          options before your visit.
        </p>
      </section>

      <section aria-label="Contact details" className="contact-details">
        <div>
          <span className="footer-label">ADDRESS</span>
          <address>
            Lotus Gym
            <br />
            {gym.address.street}
            <br />
            {gym.address.building}
            <br />
            {gym.address.city}, {gym.address.postalCode}, {gym.address.country}
          </address>
          <p className="plus-code">PLUS CODE&nbsp; {gym.plusCode}</p>
        </div>
        <div>
          <span className="footer-label">PHONE</span>
          <a className="contact-phone" href={`tel:${gym.phone.href}`}>
            {gym.phone.display}
          </a>
          <span className="footer-label hours-label">OPENING HOURS</span>
          <p className="contact-hours">{gym.hoursNote}</p>
        </div>
        <a className="button button-lime" href={gym.mapsUrl} rel="noreferrer" target="_blank">
          Directions in Google Maps <span aria-hidden="true">↗</span>
        </a>
      </section>

      <div className="map-frame">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapsEmbedUrl}
          title="Google Maps search for Lotus Gym, Bulevardi Zogu I 1, Tirana"
        />
      </div>

      <section aria-labelledby="contact-form-title" className="contact-form-section">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h2 id="contact-form-title">
            Send us
            <br />
            <em>a message.</em>
          </h2>
          <p className="contact-form-intro">
            No official email address has been supplied. The form will only
            enable once a verified sender and recipient are configured.
          </p>
        </div>
        <ContactForm enabled={contactFormConfigured} />
      </section>
    </main>
  );
}

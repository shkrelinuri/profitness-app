import type { Metadata } from "next";
import { LocalizedText } from "@/components/language-provider";
import ContactForm from "@/components/contact-form";
import { gym } from "@/lib/gym";
import { getFormspreeFormId } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact and location",
  description:
    "Contact Lotus Gym in Tirana. View the address, phone number, and map directions.",
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-heading">
        <p className="eyebrow"><span /><LocalizedText id="contact.kicker" /></p>
        <h1>
          <LocalizedText id="contact.heading" />
          <br />
          <LocalizedText as="em" id="contact.highlight" />
        </h1>
        <LocalizedText as="p" id="contact.intro" />
      </section>

      <section aria-label="Contact details" className="contact-details">
        <div>
          <span className="footer-label"><LocalizedText id="contact.address" /></span>
          <address>
            Lotus Gym
            <br />
            {gym.address.street}
            <br />
            {gym.address.building}
            <br />
            {gym.address.city}, {gym.address.postalCode}, {gym.address.country}
          </address>
        </div>
        <div>
          <span className="footer-label"><LocalizedText id="contact.phone" /></span>
          <a className="contact-phone" href={`tel:${gym.phone.href}`}>
            {gym.phone.display}
          </a>
          <span className="footer-label hours-label"><LocalizedText id="contact.hours" /></span>
          <p className="contact-hours"><LocalizedText id="footer.hours" /></p>
        </div>
        <a className="button button-lime" href={gym.mapsUrl} rel="noreferrer" target="_blank">
          <LocalizedText id="contact.directions" /> <span aria-hidden="true">↗</span>
        </a>
      </section>

      <div className="map-frame">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={gym.mapsEmbedUrl}
          title="Google Maps location for Lotus Gym, Tirana"
        />
      </div>

      <section aria-labelledby="contact-form-title" className="contact-form-section">
        <div>
          <p className="eyebrow"><LocalizedText id="contact.message.kicker" /></p>
          <h2 id="contact-form-title">
            <LocalizedText id="contact.message.first" />
            <br />
            <LocalizedText as="em" id="contact.message.highlight" />
          </h2>
          <LocalizedText as="p" className="contact-form-intro" id="contact.message.description" />
        </div>
        <ContactForm enabled={Boolean(getFormspreeFormId())} />
      </section>
    </main>
  );
}

import Link from "next/link";
import { Brand } from "@/components/site-header";
import { gym, siteNavigation } from "@/lib/gym";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Brand footer />
          <p>Lotus Gym in the heart of Tirana.</p>
        </div>
        <div className="footer-nav">
          <span className="footer-label">EXPLORE</span>
          {siteNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="footer-contact">
          <span className="footer-label">FIND THE GYM</span>
          <address>{gym.address.full}</address>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
          <a href={gym.mapsUrl} rel="noreferrer" target="_blank">
            Open in Google Maps ↗
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {gym.brandName}</span>
        <span>Opening times: call to confirm.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

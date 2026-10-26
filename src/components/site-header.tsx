import Link from "next/link";
import { gym, siteNavigation } from "@/lib/gym";

function LotusIcon() {
  return (
    <svg aria-hidden="true" className="lotus-icon" viewBox="0 0 40 36" fill="none">
      <path d="M20 32C9.5 27.8 7.2 18.1 20 3c12.8 15.1 10.5 24.8 0 29Z" />
      <path d="M18 32C7.2 30.5 2.4 24.2 3 15.5 11.7 17.1 17.1 22.3 18 32Z" />
      <path d="M22 32c10.8-1.5 15.6-7.8 15-16.5C28.3 17.1 22.9 22.3 22 32Z" />
      <path d="M5 33h30" />
    </svg>
  );
}

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link aria-label={`${gym.brandName} home`} className="brand" href="/">
      <LotusIcon />
      <span className="brand-wordmark">
        <span>LOTUS</span>
        <small>{footer ? gym.name : "FITNESS GYM"}</small>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {siteNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="login-link" href="/login">
            Login
          </Link>
          <Link className="button button-lime header-cta" href="/memberships">
            Join now <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            {siteNavigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/login">Login</Link>
            <Link href="/memberships">Join now</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

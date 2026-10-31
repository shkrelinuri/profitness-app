"use client";

import Link from "next/link";
import { LocalizedText, useLanguage } from "@/components/language-provider";
import { Brand } from "@/components/site-header";
import { gym } from "@/lib/gym";
import type { TranslationKey } from "@/lib/translations";

const navigation = [
  { key: "navigation.services", href: "/services" },
  { key: "navigation.memberships", href: "/memberships" },
  { key: "navigation.schedule", href: "/schedule" },
  { key: "navigation.about", href: "/about" },
  { key: "navigation.contact", href: "/contact" },
] as const satisfies readonly { key: TranslationKey; href: string }[];

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Brand footer />
        </div>
        <div className="footer-nav">
          <span className="footer-label">{t("footer.explore")}</span>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {t(item.key)}
            </Link>
          ))}
        </div>
        <div className="footer-contact">
          <span className="footer-label">{t("footer.find")}</span>
          <address>{gym.address.full}</address>
          <a href={`tel:${gym.phone.href}`}>{gym.phone.display}</a>
          <a href={gym.mapsUrl} rel="noreferrer" target="_blank">
            {t("contact.directions")} ↗
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {gym.brandName}</span>
        <LocalizedText id="footer.hours" />
        <div>
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
        </div>
      </div>
    </footer>
  );
}

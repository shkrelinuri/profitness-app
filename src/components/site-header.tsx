"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { gym } from "@/lib/gym";
import type { TranslationKey } from "@/lib/translations";

const navigation = [
  { key: "navigation.services", href: "/services" },
  { key: "navigation.memberships", href: "/memberships" },
  { key: "navigation.schedule", href: "/schedule" },
  { key: "navigation.about", href: "/about" },
  { key: "navigation.contact", href: "/contact" },
] as const satisfies readonly { key: TranslationKey; href: string }[];

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      aria-label={`${gym.brandName} home`}
      className={`brand${footer ? " brand-footer" : ""}`}
      href="/"
    >
      <Image
        alt=""
        className="brand-logo"
        height={150}
        src="/lotuslogo.png"
        width={150}
      />
    </Link>
  );
}

export default function SiteHeader() {
  const { t } = useLanguage();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeMenu() {
      if (window.matchMedia("(max-width: 760px)").matches && mobileMenuRef.current) {
        mobileMenuRef.current.open = false;
      }
    }

    function closeOnOutsideInteraction(event: PointerEvent | TouchEvent) {
      const menu = mobileMenuRef.current;
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("scroll", closeMenu, true);
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("touchstart", closeOnOutsideInteraction, { passive: true });
    document.addEventListener("keydown", handleEscape);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    return () => {
      document.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("touchstart", closeOnOutsideInteraction);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeMenu() {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <Link className="login-link" href="/login">{t("navigation.login")}</Link>
          <Link className="button button-lime header-cta" href="/memberships">
            {t("navigation.join")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <details className="mobile-menu" ref={mobileMenuRef}>
          <summary aria-label={t("navigation.open")}>
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            <LanguageSwitcher />
            {navigation.map((item) => (
              <Link href={item.href} key={item.href} onClick={closeMenu}>
                {t(item.key)}
              </Link>
            ))}
            <Link href="/login" onClick={closeMenu}>{t("navigation.login")}</Link>
            <Link className="mobile-menu-cta" href="/memberships" onClick={closeMenu}>
              {t("navigation.join")} <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

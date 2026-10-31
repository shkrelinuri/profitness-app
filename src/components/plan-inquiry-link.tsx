"use client";

import { useLanguage } from "@/components/language-provider";

export default function PlanInquiryLink() {
  const { t, language } = useLanguage();
  const message = t(language === "sq" ? "inquiry.albanian" : "inquiry.english");
  const href = `https://wa.me/355693055396?text=${encodeURIComponent(message)}`;

  return (
    <a
      className="button button-lime pricing-cta"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {t("memberships.ask")} <span aria-hidden="true">↗</span>
    </a>
  );
}

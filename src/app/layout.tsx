import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./service-worker-registration";
import { LanguageProvider, LocalizedText } from "@/components/language-provider";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "Lotus Fitness Gym | Tirana, Albania",
    template: "%s | Lotus Fitness Gym",
  },
  description:
    "Find Lotus Gym at Bulevardi Zogu I 1 in central Tirana. Open Monday–Saturday 9:00 AM–11:00 PM and Sunday 9:00 AM–4:00 PM.",
  applicationName: "Lotus Fitness Gym",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/lotuslogo.png",
    apple: "/lotuslogo.png",
  },
  openGraph: {
    title: "Lotus Fitness Gym | Tirana, Albania",
    description:
      "Find Lotus Gym at Bulevardi Zogu I 1 in Tirana. Call for current information and directions.",
    type: "website",
    siteName: "Lotus Fitness Gym",
    locale: "en_US",
  },
  appleWebApp: {
    capable: true,
    title: "Lotus Gym",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#100b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ServiceWorkerRegistration />
        <LanguageProvider>
          <a className="skip-link" href="#main-content">
            <LocalizedText id="navigation.skip" />
          </a>
          <SiteHeader />
          <div id="main-content">{children}</div>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}

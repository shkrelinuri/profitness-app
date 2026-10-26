import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./service-worker-registration";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "Lotus Fitness Gym | Tirana, Albania",
    template: "%s | Lotus Fitness Gym",
  },
  description:
    "Find Lotus Gym at Bulevardi Zogu I 1, central Tirana. Call for verified opening hours, current services, and membership information.",
  applicationName: "Lotus Fitness Gym",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
  themeColor: "#111310",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

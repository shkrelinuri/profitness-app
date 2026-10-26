import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./service-worker-registration";

export const metadata: Metadata = {
  title: "ProFitness Training Club | Find Your Strong",
  description:
    "A welcoming place to move, build strength, and find your rhythm. Discover the ProFitness Training Club.",
  applicationName: "ProFitness Training Club",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "ProFitness",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#f5f4ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}

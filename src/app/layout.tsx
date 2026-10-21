import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Urban Route NZ", template: "%s" },
  description:
    "Temporary traffic management planning, quantity surveying, project coordination and traffic impact assessments across New Zealand.",
  openGraph: { type: "website", locale: "en_NZ", siteName: "Urban Route NZ" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#17232B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang="en-NZ" className={manrope.variable}>
      <body className="min-h-screen font-sans">
        {children}
        {plausible && (
          <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/layout/cookie-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AfroCodeurs — Des problèmes aux solutions, ensemble.",
    template: "%s · AfroCodeurs",
  },
  description:
    "La communauté panafricaine où les passionnés de technologie apprennent, collaborent et construisent des solutions adaptées aux réalités du continent.",
  applicationName: "AfroCodeurs",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "AfroCodeurs",
    locale: "fr_FR",
    title: "AfroCodeurs — Des problèmes aux solutions, ensemble.",
    description:
      "La communauté panafricaine des makers tech. Build Before Consume.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfroCodeurs",
    description:
      "La communauté panafricaine des makers tech. Build Before Consume.",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

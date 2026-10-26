import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { ThemeScript } from "@/components/layout/theme-script";
import { ChatDock } from "@/features/messaging/chat-dock";
import { FeedbackWidget } from "@/features/product-feedback/feedback-widget";
import { SITE_DESCRIPTION, siteUrl as canonicalSiteUrl } from "@/lib/seo";

const displaySans = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = canonicalSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AfroCodeurs — Communauté tech africaine et panafricaine",
    template: "%s · AfroCodeurs",
  },
  description: SITE_DESCRIPTION,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  applicationName: "AfroCodeurs",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "AfroCodeurs",
    locale: "fr_FR",
    title: "AfroCodeurs — Communauté tech africaine et panafricaine",
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AfroCodeurs, communauté tech africaine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfroCodeurs",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${displaySans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <FeedbackWidget />
        <ChatDock />
        <CookieBanner />
      </body>
    </html>
  );
}

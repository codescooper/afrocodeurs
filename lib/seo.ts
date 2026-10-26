import type { Metadata } from "next";
import { COMMUNITY_EMAIL, GITHUB_URL } from "./community-links";

export const SITE_DESCRIPTION = "AfroCodeurs est une communauté tech africaine et panafricaine : développeurs, designers, étudiants et entrepreneurs partagent des ressources, contribuent à des projets open source et collaborent.";

export function siteUrl(path = "/"): string {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("A local site path is required");
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://afrocodeurs.org").origin;
  return new URL(path, origin).href;
}

export function publicMetadata(path: string, title: string, description: string): Metadata {
  const summary = description.replace(/\s+/g, " ").trim().slice(0, 200);
  return {
    title, description: summary, alternates: { canonical: siteUrl(path) },
    openGraph: { type: "website", locale: "fr_FR", siteName: "AfroCodeurs", url: siteUrl(path), title: `${title} · AfroCodeurs`, description: summary, images: [{ url: siteUrl("/opengraph-image"), width: 1200, height: 630, alt: "AfroCodeurs, communauté tech africaine" }] },
    twitter: { card: "summary_large_image", title: `${title} · AfroCodeurs`, description: summary, images: [siteUrl("/opengraph-image")] },
  };
}

export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

export function paginatedPath(path: string, page?: string): string {
  if (path !== "/constellation" && path !== "/mentorship") return path;
  const parsed = typeof page === "string" && /^[1-9]\d{0,3}$/.test(page) ? Number(page) : 1;
  return parsed > 1 && parsed <= 1000 ? `${path}?page=${parsed}` : path;
}

export function communityStructuredData() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": siteUrl("/#organization"), name: "AfroCodeurs", url: siteUrl(), description: SITE_DESCRIPTION, logo: siteUrl("/icon.svg"), email: COMMUNITY_EMAIL, sameAs: [GITHUB_URL], areaServed: { "@type": "Place", name: "Afrique et diaspora africaine" }, knowsAbout: ["Technologie en Afrique", "Développement logiciel", "Open source", "Mentorat tech", "Entrepreneuriat numérique"] },
    { "@type": "WebSite", "@id": siteUrl("/#website"), url: siteUrl(), name: "AfroCodeurs", inLanguage: "fr", publisher: { "@id": siteUrl("/#organization") } },
  ] };
}

export function serializeStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ["*", "OAI-SearchBot"].map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api/", "/messages", "/login", "/register", "/forgot-password", "/reset-password", "/search", "/labs/"],
    })),
    sitemap: siteUrl("/sitemap.xml"),
  };
}

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { VentureCloud } from "../features/constellation/cloud";
import AboutPage from "../app/a-propos/page";

it("exposes project names, summaries and crawlable links before JavaScript", () => {
  const html = renderToStaticMarkup(createElement(VentureCloud, { ventures: [{ id: "one", slug: "service", name: "Projet de la communauté", summary: "Une solution utile déjà déployée.", country: "CI", sector: "SERVICES", logoUrl: null, needs: [] }] }));
  expect(html).toContain('href="/constellation/service"');
  expect(html).toContain("Projet de la communauté");
  expect(html).toContain("Une solution utile déjà déployée.");
  expect(html).toContain("<ul");
  expect(html).not.toContain("Chargement des réalisations");
});

it("renders an accessible community presentation and factual structured data without a database", () => {
  const html = renderToStaticMarkup(createElement(AboutPage));
  expect(html).toContain("Une communauté tech africaine et panafricaine");
  expect(html).toContain("A pan-African tech community");
  expect(html).toContain('href="/register"');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain('"@type":"AboutPage"');
});

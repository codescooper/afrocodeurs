import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { VentureCloud } from "../features/constellation/cloud";
import AboutPage from "../app/a-propos/page";
import ParticipatePage from "../app/participer/page";

it("offers public first contributions and an open-source contribution route", () => {
  const html = renderToStaticMarkup(createElement(ParticipatePage));
  for (const path of ["/constellation", "/projects", "/forum", "/mentorship", "/communities", "/register"]) {
    expect(html).toContain(`href="${path}"`);
  }
  expect(html).toContain("github.com/codescooper/afrocodeurs/contribute");
  expect(html).toContain("open source ou non");
});

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

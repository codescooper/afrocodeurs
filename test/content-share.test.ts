import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { isShareCancellation, publicShareUrl, whatsappShareUrl } from "../lib/content-share";
import { ContentShare } from "../components/shared/content-share";

describe("public content sharing", () => {
  it("recognizes cancellation without requiring an Error prototype", () => {
    expect(isShareCancellation({ name: "AbortError" })).toBe(true);
    expect(isShareCancellation(new DOMException("Cancelled", "AbortError"))).toBe(true);
    expect(isShareCancellation({ name: "NotAllowedError" })).toBe(false);
    expect(isShareCancellation(null)).toBe(false);
    expect(isShareCancellation("AbortError")).toBe(false);
  });
  it("renders accessible controls without accessing browser APIs on the server", () => {
    const html = renderToStaticMarkup(createElement(ContentShare, {
      title: "AfroCodeurs",
      path: "/projects/afrocodeurs",
    }));
    expect(html).toContain('aria-label="Partager ce contenu"');
    expect(html).toContain('aria-label="Copier le lien"');
    expect(html).toContain('role="status"');
    expect(html.match(/type="button"/g)).toHaveLength(3);
    expect(html).not.toContain("https://wa.me/");
  });
  it("uses the current origin without its query or fragment", () => {
    expect(publicShareUrl("/projects/afrocodeurs", "https://afrocodeurs.org/register?token=private#secret"))
      .toBe("https://afrocodeurs.org/projects/afrocodeurs");
  });

  it.each(["//evil.example/path", "https://evil.example", "/\\evil.example", "/forum/test?token=secret", "/forum/test#secret"])("rejects unsafe paths: %s", (path) => {
    expect(() => publicShareUrl(path, "https://afrocodeurs.org")).toThrow();
  });

  it("rejects non-web origins", () => {
    expect(() => publicShareUrl("/forum/test", "file:///tmp/test")).toThrow();
  });

  it("encodes the full message without changing its title or link", () => {
    const title = "Santé & éducation #Afrique";
    const url = "https://afrocodeurs.org/knowledge/sante";
    const share = new URL(whatsappShareUrl(title, url));
    expect(share.origin + share.pathname).toBe("https://wa.me/");
    expect(share.searchParams.get("text")).toBe(`${title}\n${url}`);
    expect([...share.searchParams.keys()]).toEqual(["text"]);
  });
});

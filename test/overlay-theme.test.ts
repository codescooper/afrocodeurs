import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { expect, it } from "vitest";

const source = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const tree = postcss.parse(source);
function palette(theme: "light" | "dark" | "system") {
  const values = new Map<string, string>();
  tree.walkRules((rule) => {
    if (rule.selector === ":root" || (theme === "dark" && rule.selector === ':root[data-theme="dark"]') || (theme === "system" && rule.selector === ':root:not([data-theme="light"])')) {
      rule.walkDecls((decl) => { values.set(decl.prop, decl.value); });
    }
  });
  function resolve(key: string): string {
    const value = values.get(key) ?? "";
    const alias = /^var\((--[\w-]+)\)$/.exec(value);
    return alias ? resolve(alias[1]) : value;
  }
  return resolve;
}
it.each(["light", "dark", "system"] as const)("defines opaque floating surfaces and contrasting text (%s)", (theme) => {
  const resolve = palette(theme);
  expect(resolve("--popover")).toMatch(/^#[\da-f]{6}$/i);
  expect(resolve("--popover-foreground")).toMatch(/^#[\da-f]{6}$/i);
  expect(resolve("--popover")).not.toBe(resolve("--popover-foreground"));
});
it("generates real Tailwind utilities for every shared overlay surface", async () => {
  const result = await postcss([tailwind()]).process(source, { from: fileURLToPath(new URL("../app/globals.css", import.meta.url)) });
  const css = postcss.parse(result.css);
  for (const selector of [".bg-popover", ".text-popover-foreground", ".bg-background", ".bg-foreground"]) {
    let found = false;
    css.walkRules(selector, (rule) => { if (rule.nodes.length) found = true; });
    expect(found, `Missing generated utility ${selector}`).toBe(true);
  }
}, 20000);

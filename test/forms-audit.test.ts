import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

function editable(node: ts.Node): boolean {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText();
    if (tag === "textarea" || tag === "select") return true;
    if (tag === "input") {
      const attr = node.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.getText() === "type");
      return !(attr && ts.isJsxAttribute(attr) && attr.initializer && ts.isStringLiteral(attr.initializer) && ["hidden", "submit", "button"].includes(attr.initializer.text));
    }
  }
  return Boolean(ts.forEachChild(node, child => editable(child) || undefined));
}

it("protects every editable action form from implicit resets", () => {
  const unprotected: string[] = [];
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) { scan(file); continue; }
      // A terminal command is deliberately cleared after execution, unlike a draft.
      if (!file.endsWith(".tsx") || file.endsWith("pixel-terminal-game.tsx")) continue;
      const text = readFileSync(file, "utf8");
      if (!text.includes("<form")) continue;
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === "form") {
          const attrs = node.openingElement.attributes.properties;
          const action = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText() === "action");
          const custom = attrs.some(a => ts.isJsxAttribute(a) && a.name.getText() === "onSubmit");
          if (action && ts.isJsxAttribute(action) && action.initializer && ts.isJsxExpression(action.initializer) && !custom && editable(node)) unprotected.push(file);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  for (const directory of ["app", "features", "components"]) scan(directory);
  expect(unprotected).toEqual([]);
});

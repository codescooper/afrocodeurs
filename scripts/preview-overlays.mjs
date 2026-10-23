import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

// Isolated visual fixture: uses the real theme, without accounts or database.
const cssPath = fileURLToPath(new URL("../app/globals.css", import.meta.url));
const { css } = await postcss([tailwind()]).process(await readFile(cssPath, "utf8"), { from: cssPath });
const surfaces = [
  ["Recherche de membres", "bg-popover text-popover-foreground"],
  ["Menu utilisateur / mobile", "bg-popover text-popover-foreground"],
  ["Sous-menu", "bg-popover text-popover-foreground"],
  ["Dialogue / Constellation", "bg-background text-foreground"],
  ["Notifications", "bg-background text-foreground"],
  ["Discussion compacte", "bg-background text-foreground"],
  ["Infobulle", "bg-foreground text-background"],
];
const port = Number(process.env.PORT ?? 3034);
createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname === "/theme.css") { response.setHeader("content-type", "text/css"); response.end(css); return; }
  const dark = url.searchParams.get("theme") === "dark";
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(`<!doctype html><html lang="fr" data-theme="${dark ? "dark" : "light"}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recette des surfaces AfroCodeurs</title><link rel="stylesheet" href="/theme.css"><style>body{padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:24px}article{position:relative;height:200px;padding-top:32px}.underlay{position:absolute;inset:65px 8px 8px;color:#dc2626;font-weight:bold}.surface{position:absolute;inset:60px 0 8px;padding:20px;border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 20px #0002}header{margin-bottom:24px}a{margin-right:16px;text-decoration:underline}</style><header><h1>Recette des surfaces</h1><a href="/?theme=light">Clair</a><a href="/?theme=dark">Sombre</a></header><main>${surfaces.map(([name, classes]) => `<article><h2>${name}</h2><div class="underlay">CE TEXTE NE DOIT PAS TRAVERSER LE PANNEAU</div><div data-surface="${name}" class="surface ${classes}"><strong>Surface opaque</strong><p>Le contenu reste lisible au-dessus de la page.</p></div></article>`).join("")}</main></html>`);
}).listen(port, "127.0.0.1", () => console.log(`Overlay fixture: http://127.0.0.1:${port}`));

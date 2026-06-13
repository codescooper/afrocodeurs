#!/usr/bin/env node
// @ts-check
/*
 * run — runner de projet portable et réutilisable.
 *
 * Un jeu de commandes uniforme (start/build/test/lint/format/logs/deploy/clean/
 * doctor) qui s'adapte à la stack du repo dans lequel il est déposé :
 *   1. surcharge explicite via run.config.json  (toujours prioritaire)
 *   2. sinon, détection automatique de la stack (Node, Rust, Go, Python, Deno, Make)
 *
 * Aucune dépendance : uniquement les modules natifs de Node. Pour le réutiliser
 * ailleurs, copie ce fichier (+ les lanceurs run / run.ps1 / run.cmd) et,
 * au besoin, ajoute un run.config.json. Voir scripts/README.md.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  rmSync,
} from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { createInterface } from "node:readline";
import os from "node:os";

/* ------------------------------------------------------------------ couleurs */
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint(1);
const dim = paint(2);
const red = paint(31);
const green = paint(32);
const yellow = paint(33);
const cyan = paint(36);

const log = (...a) => console.log(...a);
const info = (m) => log(cyan("›"), m);
const ok = (m) => log(green("✓"), m);
const warn = (m) => log(yellow("⚠"), m);
const fail = (m) => log(red("✗"), m);
const die = (m, code = 1) => {
  fail(m);
  process.exit(code);
};

/* -------------------------------------------------------------- racine projet */
function findRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (
      existsSync(join(dir, ".git")) ||
      existsSync(join(dir, "run.config.json")) ||
      existsSync(join(dir, "package.json"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}
const ROOT = findRoot(process.cwd());
const at = (p) => join(ROOT, p);
const rel = (p) => relative(ROOT, p) || ".";

/* --------------------------------------------------------------------- config */
function loadConfig() {
  for (const name of ["run.config.json", ".runrc.json"]) {
    if (existsSync(at(name))) {
      try {
        return JSON.parse(readFileSync(at(name), "utf8"));
      } catch (e) {
        warn(`${name} illisible (JSON invalide) : ${e.message}`);
      }
    }
  }
  return {};
}
const config = loadConfig();

/* ---------------------------------------------------------- détection de stack */
const has = (f) => existsSync(at(f));
function readPkg() {
  try {
    return JSON.parse(readFileSync(at("package.json"), "utf8"));
  } catch {
    return {};
  }
}
function detectStack() {
  if (has("package.json")) {
    const pm = has("pnpm-lock.yaml")
      ? "pnpm"
      : has("yarn.lock")
        ? "yarn"
        : has("bun.lockb") || has("bun.lock")
          ? "bun"
          : "npm";
    return { id: "node", label: "Node.js", pm };
  }
  if (has("Cargo.toml")) return { id: "rust", label: "Rust" };
  if (has("go.mod")) return { id: "go", label: "Go" };
  if (has("pyproject.toml") || has("requirements.txt") || has("setup.py"))
    return { id: "python", label: "Python" };
  if (has("deno.json") || has("deno.jsonc")) return { id: "deno", label: "Deno" };
  if (has("Makefile") || has("makefile")) return { id: "make", label: "Make" };
  return { id: "unknown", label: "inconnue" };
}
const stack = detectStack();
const pkg = stack.id === "node" ? readPkg() : {};
const scripts = pkg.scripts || {};
const hasDep = (name) =>
  Boolean((pkg.dependencies && pkg.dependencies[name]) ||
    (pkg.devDependencies && pkg.devDependencies[name]));

/* ------------------------------------------------- résolution verbe → commande */
function nodeRun(script) {
  return `${stack.pm} run ${script}`;
}
function nodeFormatter(fix) {
  if (scripts[fix ? "format:fix" : "format"]) return nodeRun(fix ? "format:fix" : "format");
  if (scripts.format) return nodeRun("format");
  if (hasDep("prettier") || existsSync(at("node_modules/.bin/prettier")))
    return `npx prettier ${fix ? "--write" : "--check"} .`;
  if (hasDep("@biomejs/biome"))
    return `npx biome ${fix ? "format --write" : "format"} .`;
  return null;
}
function defaultCommand(verb) {
  switch (stack.id) {
    case "node":
      switch (verb) {
        case "start":
          return scripts.dev ? nodeRun("dev") : scripts.start ? nodeRun("start") : null;
        case "build":
          return scripts.build ? nodeRun("build") : null;
        case "test":
          return scripts.test ? nodeRun("test") : null;
        case "lint":
          return scripts.lint ? nodeRun("lint") : null;
        case "format":
          return nodeFormatter(false);
        case "format:fix":
          return nodeFormatter(true);
        default:
          return null;
      }
    case "rust":
      return {
        start: "cargo run",
        build: "cargo build --release",
        test: "cargo test",
        lint: "cargo clippy",
        format: "cargo fmt --check",
        "format:fix": "cargo fmt",
      }[verb] ?? null;
    case "go":
      return {
        start: "go run .",
        build: "go build ./...",
        test: "go test ./...",
        lint: "go vet ./...",
        format: "gofmt -l .",
        "format:fix": "gofmt -w .",
      }[verb] ?? null;
    case "python":
      return {
        test: "pytest",
        lint: "ruff check .",
        format: "ruff format --check .",
        "format:fix": "ruff format .",
      }[verb] ?? null;
    case "deno":
      return {
        start: "deno task dev",
        test: "deno test",
        lint: "deno lint",
        format: "deno fmt --check",
        "format:fix": "deno fmt",
      }[verb] ?? null;
    case "make":
      return ["start", "build", "test", "lint", "clean"].includes(verb)
        ? `make ${verb}`
        : null;
    default:
      return null;
  }
}
function resolveCommand(verb) {
  const override = config.commands && config.commands[verb];
  if (typeof override === "string" && override.trim()) return override;
  return defaultCommand(verb);
}

/* ------------------------------------------------------------------- exécution */
function runShell(command, { extra = [], capture = false } = {}) {
  const full = extra.length ? `${command} ${extra.join(" ")}` : command;
  return spawnSync(full, {
    cwd: ROOT,
    shell: true,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
  });
}
function gitOut(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

/* ---------------------------------------------------------------------- prompt */
function confirm(question, autoYes) {
  if (autoYes) return Promise.resolve(true);
  if (!process.stdin.isTTY) {
    warn("contexte non-interactif — relance avec --yes pour confirmer.");
    return Promise.resolve(false);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) =>
    rl.question(`${question} ${dim("[y/N]")} `, (a) => {
      rl.close();
      res(/^y(es)?$/i.test(a.trim()));
    }),
  );
}

/* --------------------------------------------------------------------- helpers */
function human(bytes) {
  const u = ["o", "Ko", "Mo", "Go"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function pathSize(p) {
  let total = 0;
  const st = statSync(p);
  if (st.isFile()) return st.size;
  for (const name of readdirSync(p)) {
    try {
      total += pathSize(join(p, name));
    } catch {
      /* ignore */
    }
  }
  return total;
}

/* ----------------------------------------------------------------------- verbes */
function runWrapped(verb, { passthrough }) {
  const command = resolveCommand(verb);
  if (!command) {
    warn(`aucune commande "${verb}" pour la stack ${stack.label}.`);
    info(`définis-la dans run.config.json → "commands": { "${verb}": "…" }`);
    return 0;
  }
  info(`${verb} → ${bold(command)}`);
  const r = runShell(command, { extra: passthrough });
  return r.status ?? 1;
}

function formatVerb({ flags, passthrough }) {
  const fix = Boolean(flags.fix);
  const command = resolveCommand(fix ? "format:fix" : "format");
  if (!command) {
    warn("aucun formateur détecté (Prettier, Biome, ruff, gofmt…).");
    info('ajoute-le et/ou définis run.config.json → "commands": { "format": "…" }');
    return 0;
  }
  info(`${fix ? "format --fix" : "format"} → ${bold(command)}`);
  return runShell(command, { extra: passthrough }).status ?? 1;
}

function logsVerb({ flags }) {
  const candidates = config.logs ?? [
    ".next/dev/logs",
    ".next/server",
    "logs",
    "log",
    "tmp/logs",
  ];
  /** @type {{path:string, mtime:number, size:number}[]} */
  const found = [];
  const consider = (p) => {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isFile()) {
      found.push({ path: p, mtime: st.mtimeMs, size: st.size });
    } else if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (name.endsWith(".log")) {
          const fp = join(p, name);
          try {
            const fst = statSync(fp);
            found.push({ path: fp, mtime: fst.mtimeMs, size: fst.size });
          } catch {
            /* ignore */
          }
        }
      }
    }
  };
  for (const c of candidates) consider(at(c));
  // logs de debug éventuels à la racine
  for (const name of readdirSync(ROOT)) {
    if (/(^npm-debug|\.log$)/.test(name)) consider(at(name));
  }
  if (found.length === 0) {
    warn("aucun fichier de log trouvé.");
    info('configure les emplacements via run.config.json → "logs": ["chemin"]');
    return 0;
  }
  found.sort((a, b) => b.mtime - a.mtime);
  if (flags.all) {
    info(`${found.length} fichier(s) de log :`);
    for (const f of found) {
      log(
        `  ${dim(new Date(f.mtime).toLocaleString())}  ${human(f.size).padStart(8)}  ${rel(f.path)}`,
      );
    }
    return 0;
  }
  const target = found[0];
  const n = Number(flags.lines) > 0 ? Number(flags.lines) : 40;
  const lines = readFileSync(target.path, "utf8").split(/\r?\n/);
  const tail = lines.slice(-n);
  info(
    `${rel(target.path)} ${dim(`(${n} dernières lignes · ${found.length} log(s), --all pour tout, --lines N)`)}`,
  );
  log(tail.join("\n"));
  return 0;
}

async function cleanVerb({ flags }) {
  const targets = config.clean ?? {
    node: [".next", "dist", "out", "build", "coverage", ".turbo", ".cache", "*.tsbuildinfo"],
    rust: ["target"],
    go: [],
    python: [".pytest_cache", "__pycache__", ".ruff_cache", "build", "dist"],
    deno: [],
    make: [],
    unknown: [],
  }[stack.id];
  // résolution (gère les motifs *.ext à la racine)
  const matches = [];
  for (const t of targets) {
    if (t.includes("*")) {
      const re = new RegExp("^" + t.replace(/[.]/g, "\\.").replace(/\*/g, ".*") + "$");
      for (const name of readdirSync(ROOT)) if (re.test(name)) matches.push(at(name));
    } else if (existsSync(at(t))) {
      matches.push(at(t));
    }
  }
  if (matches.length === 0) {
    ok("rien à nettoyer.");
    return 0;
  }
  let totalSize = 0;
  info("cibles de nettoyage :");
  for (const m of matches) {
    const size = (() => {
      try {
        return pathSize(m);
      } catch {
        return 0;
      }
    })();
    totalSize += size;
    log(`  ${red("rm")} ${rel(m)} ${dim(`(${human(size)})`)}`);
  }
  log(dim(`  total : ${human(totalSize)}`));
  if (flags["dry-run"]) {
    info("--dry-run : rien n'a été supprimé.");
    return 0;
  }
  if (!(await confirm("Supprimer ces éléments ?", flags.yes))) {
    warn("annulé.");
    return 0;
  }
  for (const m of matches) {
    rmSync(m, { recursive: true, force: true });
    log(`  ${green("supprimé")} ${rel(m)}`);
  }
  ok(`nettoyage terminé (${human(totalSize)} libérés).`);
  return 0;
}

async function deployVerb({ flags }) {
  if (!gitOut(["rev-parse", "--is-inside-work-tree"])) {
    die("deploy : pas un dépôt git.");
  }
  // 1. arbre propre
  const dirty = gitOut(["status", "--porcelain"]);
  if (dirty && !flags.force) {
    fail("arbre git non propre — commit/stash, ou --force pour passer outre.");
    log(dim(dirty.split("\n").slice(0, 8).map((l) => "  " + l).join("\n")));
    return 1;
  }
  // 2. branche
  const branch = gitOut(["rev-parse", "--abbrev-ref", "HEAD"]) ?? "?";
  const sha = gitOut(["rev-parse", "--short", "HEAD"]) ?? "?";
  const wanted = config.deployBranch;
  if (wanted && branch !== wanted && !flags.force) {
    return (
      fail(`branche courante "${branch}" ≠ branche de déploiement "${wanted}" (--force pour passer outre.)`),
      1
    );
  }
  // 3. préflight : lint + test + build (uniquement ceux qui sont configurés)
  for (const step of ["lint", "test", "build"]) {
    const command = resolveCommand(step);
    if (!command) {
      log(dim(`  préflight ${step} : ignoré (non configuré)`));
      continue;
    }
    info(`préflight ${step} → ${bold(command)}`);
    const code = runShell(command).status ?? 1;
    if (code !== 0) return fail(`préflight ${step} a échoué — déploiement interrompu.`), code;
    ok(`préflight ${step} OK`);
  }
  // 4. confirmation
  const name = config.name ?? pkg.name ?? rel(ROOT);
  if (!(await confirm(`Déployer ${bold(name)} depuis ${bold(branch)}@${sha} ?`, flags.yes))) {
    warn("déploiement annulé.");
    return 0;
  }
  // 5. hook de déploiement
  const deployCmd = (config.commands && config.commands.deploy) || config.deploy;
  if (!deployCmd) {
    ok("préflight validé — aucun hook de déploiement configuré.");
    info('définis-le via run.config.json → "deploy": "…" (ex. la commande de ton hébergeur).');
    return 0;
  }
  info(`deploy → ${bold(deployCmd)}`);
  return runShell(deployCmd).status ?? 1;
}

function doctorVerb() {
  info("Environnement");
  log(`  OS        : ${os.type()} ${os.release()} (${process.arch})`);
  log(`  Node      : ${process.version}`);
  const git = gitOut(["--version"]);
  log(`  git       : ${git ?? red("absent")}`);
  log(`  Stack     : ${bold(stack.label)}${stack.pm ? ` (${stack.pm})` : ""}`);
  log(`  Racine    : ${ROOT}`);
  log(`  Config    : ${existsSync(at("run.config.json")) ? "run.config.json" : dim("aucune (détection auto)")}`);
  log("");
  info("Commandes résolues pour ce projet");
  for (const [verb] of WRAPPED) {
    const c = resolveCommand(verb);
    log(`  ${verb.padEnd(8)} ${c ? bold(c) : dim("— non configuré")}`);
  }
  // avertissements utiles
  const missing = [];
  if (!resolveCommand("test")) missing.push("test");
  if (!resolveCommand("format")) missing.push("format");
  if (missing.length)
    log(
      "\n" +
        yellow(`Astuce : ${missing.join(", ")} non configuré(s). Ajoute un run.config.json ou les outils correspondants.`),
    );
  return 0;
}

const WRAPPED = [
  ["start", "Lancer l'app en développement"],
  ["build", "Build de production"],
  ["test", "Lancer les tests"],
  ["lint", "Analyser le code (linter)"],
];

function helpVerb() {
  const name = config.name ?? pkg.name ?? "projet";
  log(bold(`run — commandes de gestion de « ${name} »`) + `  ${dim(`[${stack.label}]`)}`);
  log("");
  log(bold("Usage"));
  log("  ./run <commande> [options] [-- args transmis à l'outil sous-jacent]");
  log(dim("  (Windows : .\\run.ps1 <commande>  ·  ou  node scripts/run.mjs <commande>)"));
  log("");
  log(bold("Commandes"));
  const rows = [
    ["start", "Lancer l'app en développement"],
    ["build", "Build de production"],
    ["test", "Lancer la suite de tests"],
    ["lint", "Analyser le code (linter)"],
    ["format", "Vérifier le formatage  (--fix pour corriger)"],
    ["logs", "Afficher les logs récents  (--lines N, --all)"],
    ["deploy", "Déployer en sécurité  (préflight + confirmation, --yes, --force)"],
    ["clean", "Purger fichiers temporaires/build  (--dry-run, --yes)"],
    ["doctor", "Diagnostiquer l'environnement et les commandes"],
    ["help", "Afficher cette aide"],
  ];
  for (const [v, d] of rows) log(`  ${green(v.padEnd(9))} ${d}`);
  log("");
  log(bold("Réutilisable") + " — auto-détecte la stack ; surcharge via " + cyan("run.config.json") + ". Voir scripts/README.md.");
  return 0;
}

/* ------------------------------------------------------------------ arg parsing */
function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  let passthrough = [];
  const alias = { y: "yes", h: "help", f: "force" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      passthrough = argv.slice(i + 1);
      break;
    }
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) flags[k] = v;
      else if (k === "lines" && argv[i + 1] && !argv[i + 1].startsWith("-")) flags[k] = argv[++i];
      else flags[k] = true;
    } else if (a.startsWith("-") && a.length > 1) {
      for (const ch of a.slice(1)) flags[alias[ch] || ch] = true;
    } else {
      positionals.push(a);
    }
  }
  return { verb: positionals[0], flags, passthrough };
}

/* ----------------------------------------------------------------------- main */
async function main() {
  const { verb, flags, passthrough } = parseArgs(process.argv.slice(2));
  if (flags.version) return log("run 1.0.0");
  const cmd = flags.help && !verb ? "help" : verb || "help";

  switch (cmd) {
    case "help":
      return process.exit(helpVerb());
    case "doctor":
      return process.exit(doctorVerb());
    case "logs":
      return process.exit(logsVerb({ flags }));
    case "format":
      return process.exit(formatVerb({ flags, passthrough }));
    case "clean":
      return process.exit(await cleanVerb({ flags }));
    case "deploy":
      return process.exit(await deployVerb({ flags }));
    case "start":
    case "dev":
      return process.exit(runWrapped("start", { passthrough }));
    case "build":
    case "test":
    case "lint":
      return process.exit(runWrapped(cmd, { passthrough }));
    default:
      fail(`commande inconnue : ${cmd}`);
      log("");
      return process.exit(helpVerb() || 1);
  }
}
main().catch((e) => die(e?.stack || String(e)));

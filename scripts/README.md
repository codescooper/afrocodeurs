# `run` — runner de projet

Un jeu de commandes **uniforme** pour gérer le projet, quelle que soit la stack.
Conçu pour l'open source : un nouveau contributeur tape `./run help` et sait
tout faire sans connaître les détails de l'outillage.

## Utilisation

```bash
./run <commande> [options] [-- args transmis à l'outil sous-jacent]
```

| Plateforme | Lanceur |
|------------|---------|
| macOS / Linux / Git Bash | `./run <cmd>` |
| Windows PowerShell | `.\run.ps1 <cmd>` |
| Windows cmd.exe | `run <cmd>` |
| Partout (direct) | `node scripts/run.mjs <cmd>` |

## Commandes

| Commande | Rôle | Options |
|----------|------|---------|
| `start` | Lancer l'app en développement | `-- <args>` |
| `build` | Build de production | |
| `test` | Lancer la suite de tests | `-- <args>` |
| `lint` | Analyser le code (linter) | |
| `format` | **Vérifier** le formatage | `--fix` pour corriger |
| `logs` | Afficher les logs récents | `--lines N`, `--all` |
| `deploy` | **Déployer en sécurité** | `--yes`, `--force` |
| `clean` | Purger fichiers temporaires/build | `--dry-run`, `--yes` |
| `doctor` | Diagnostiquer l'environnement | |
| `help` | Aide | |

`deploy` est volontairement prudent : il **refuse de tourner sur un arbre git
sale**, vérifie la branche (`deployBranch`), enchaîne le préflight
`lint → test → build`, **demande confirmation**, puis lance le hook de
déploiement. `clean` liste toujours les cibles et leur taille **avant** de
supprimer, et demande confirmation (sauf `--yes`).

## Réutiliser dans un autre projet

1. Copie `scripts/run.mjs` + les lanceurs `run`, `run.ps1`, `run.cmd`.
2. (Optionnel) Ajoute un `run.config.json`.

Le runner **auto-détecte** la stack et mappe les commandes :

| Stack | Détection | start / build / test / lint / format |
|-------|-----------|--------------------------------------|
| Node | `package.json` (+ lockfile → npm/pnpm/yarn/bun) | scripts npm + Prettier/Biome |
| Rust | `Cargo.toml` | `cargo run/build/test/clippy/fmt` |
| Go | `go.mod` | `go run/build/test/vet` + `gofmt` |
| Python | `pyproject.toml` / `requirements.txt` | `pytest`, `ruff` |
| Deno | `deno.json` | `deno task/test/lint/fmt` |
| Make | `Makefile` | `make <cible>` |

Une commande non résolue **ne plante pas** : elle explique comment la définir.

## `run.config.json`

Tout est optionnel ; chaque champ **surcharge** la détection.

```json
{
  "name": "mon-projet",
  "deployBranch": "main",
  "logs": [".next/dev/logs", "logs"],
  "clean": [".next", "coverage", "*.tsbuildinfo"],
  "commands": {
    "start": "docker compose up",
    "test": "vitest run",
    "deploy": "vercel deploy --prod"
  }
}
```

- **`commands`** — surcharge n'importe quel verbe par une commande shell libre.
- **`logs`** — fichiers ou dossiers (les `.log` y sont collectés, le plus récent affiché).
- **`clean`** — chemins à purger (motifs `*.ext` autorisés à la racine).
- **`deployBranch`** — branche autorisée pour `deploy`.
- **`deploy`** — raccourci équivalent à `commands.deploy`.

Aucune dépendance externe : uniquement Node (modules natifs).

# Features

Architecture modulaire (monolithe modulaire — cf. SDD §3, §5).

Chaque module encapsule un domaine métier et expose typiquement :

- `actions.ts` — Server Actions (formulaires, mutations)
- `queries.ts` — lectures Prisma (Server Components)
- `schema.ts` — schémas Zod spécifiques au module
- `components/` — composants UI du module

| Module        | Domaine                          | Sprint   |
| ------------- | -------------------------------- | -------- |
| `auth`        | Authentification, sessions       | Sprint 1 |
| `users`       | Comptes, rôles, username         | Sprint 1 |
| `profiles`    | Profils AfroMaker                | Sprint 1 |
| `communities` | Communautés, adhésions           | Sprint 2 |
| `problems`    | Problem Hub                      | Sprint 3 |
| `knowledge`   | Knowledge Hub, éditeur Markdown  | Sprint 4 |
| `forum`       | Questions, réponses, votes       | Sprint 5 |
| `atlas`       | AfroAtlas Lite (solutions, APIs) | Sprint 6 |
| `search`      | Recherche globale (Meilisearch)  | Sprint 7 |
| `reputation`  | Réputation V1                    | transverse |

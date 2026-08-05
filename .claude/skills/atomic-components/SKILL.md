---
name: atomic-components
description: |
  Use when creating or refactoring React components for AfroCodeurs. Triggers on:
  creating components, UI work, working in components/ or features/<domaine>/,
  building pages, forms, or any frontend UI. Enforces Atomic Design methodology
  with shadcn/ui base components, adapté à Next.js App Router (Server Components
  + Server Actions, pas de client-side data fetching).
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash]
---

# Atomic Design pour AfroCodeurs

## Hiérarchie

```
components/
├── ui/              # shadcn/ui (généré par `npx shadcn add …` — NE PAS ÉDITER À LA MAIN)
├── atoms/           # Briques de base, cross-domaine, sans logique métier
├── molecules/       # Atomes combinés (2-4), cross-domaine
├── organisms/       # Sections complètes, peuvent lire des données (Prisma)
├── templates/       # Squelettes de page (disposition, sans données)
└── shared/          # Existant historique (Avatar, Markdown…) — ne pas
                      # dupliquer : si un composant shared/ correspond à un
                      # atome/molécule, le déplacer en atoms/molecules au lieu
                      # d'en recréer un nouveau.

features/<domaine>/
├── actions.ts       # Server Actions (mutations)
├── queries.ts       # Lectures Prisma (Server Components)
├── schema.ts        # Zod du module
└── *.tsx            # Composants SPÉCIFIQUES au domaine qui assemblent des
                      # atoms/molecules partagés (ex : ProblemForm compose
                      # FormField ; pas un composant générique réutilisable
                      # ailleurs → reste dans le module, ne monte pas en atoms/)
```

Règle simple pour choisir où vit un composant : **générique et sans
connaissance d'un domaine métier → `components/`. Spécifique à un domaine
(forum, problems, knowledge…) → reste dans `features/<domaine>/`.**

## Règles de classification

### Atoms — aucune logique métier
- Wrapper autour d'un seul élément ou d'un shadcn `ui/*`
- Pas de state, pas de fetch de données
- Exemples : `EmptyState`, `Avatar` (déjà en `components/shared/`, à
  migrer en `atoms/` à l'occasion), un futur `LevelIndicator` (étoiles
  impact/difficulté)

```tsx
// components/atoms/empty-state.tsx
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground", className)}>{children}</div>;
}
```

### Molecules — combinent 2-4 atomes
- State local minimal autorisé (ex : bascule d'un champ)
- Pas de fetch direct, pas de Server Action appelée directement (reçoit des
  props/callbacks)
- Exemples déjà posés : `EntityCard` (carte de liste — problème, ressource,
  communauté, solution…), `FormField` (Label + Input/Textarea, branché sur
  `name` pour les Server Actions)

```tsx
// usage dans un module
<EntityCard
  href={`/explorer/${problem.slug}`}
  eyebrow={problem.sector}
  badge={PROBLEM_STATUS_LABELS[problem.status]}
  title={problem.title}
  description={problem.summary}
  meta={<>Impact {problem.impactLevel}/5 · Difficulté {problem.difficultyLevel}/5</>}
/>
```

### Organisms — sections autonomes, peuvent lire des données
- **Server Component par défaut** : appelle directement une fonction de
  `features/<domaine>/queries.ts` (pas de `useQuery`/Convex — ici c'est
  Prisma + `async function`)
- `"use client"` seulement si l'organisme a besoin d'interactivité (vote,
  formulaire avec `useActionState`, polling notifications…)
- Exemples attendus : `ProblemGrid`, `ForumThread`, `NotificationBell`

### Templates — disposition de page, sans données
- Reçoivent des organismes en `children`/slots typés
- Aucun accès Prisma, aucune logique métier
- Exemple attendu : `HubTemplate` (en-tête + grille) pour unifier
  `/explorer`, `/knowledge`, `/atlas`, `/communities` qui partagent déjà
  la même disposition (titre + description + grille de `EntityCard` +
  `EmptyState` si vide)

### Pages (`app/**/page.tsx`)
- Restent minces : `await` la query, passent les données à un
  organisme/template. Pas de markup de mise en page dupliqué page par page.

## shadcn/ui

```bash
npx shadcn@latest add <component>   # toujours par la CLI
```

Ne jamais éditer `components/ui/*` à la main — si un style spécifique est
nécessaire, l'étendre dans un atom/molecule (`components/atoms/…`) qui
compose le composant `ui/` plutôt que de le modifier en place.

## Server vs Client Components

```tsx
// PAR DÉFAUT : Server Component (pas de directive)
export function StaticStuff() { return <div>…</div>; }

// CLIENT : seulement si nécessaire
"use client";
import { useActionState } from "react";
export function SomeForm() { /* useActionState, onClick, etc. */ }
```

`"use client"` seulement pour : hooks (`useState`, `useActionState`),
gestionnaires d'événements, API navigateur. Le pattern de formulaire du
projet est `useActionState` + Server Action + `FormData` — **pas**
react-hook-form ni de resolver Zod côté client (Zod est validé côté
serveur dans l'action, cf. `lib/guard.ts` / `invalidMessage`).

## Nommage

- Fichiers en **kebab-case** (`entity-card.tsx`), comme le reste du repo —
  pas de PascalCase pour les noms de fichiers.
- Export nommé en PascalCase (`export function EntityCard`).

## Migration progressive

Ne pas migrer les ~15 modules `features/*` d'un coup. À chaque page
retouchée : remplacer le bloc "état vide" dupliqué par `EmptyState`, la
carte de liste par `EntityCard`, le champ de formulaire par `FormField`.
Le reste (composants spécifiques à un domaine) reste dans son module.

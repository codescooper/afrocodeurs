# STATUS — AfroCodeurs
> Dernière MAJ : 2026-06-10

## 🎯 Objectif de la phase actuelle
Rendre le MVP (fonctionnellement complet) exécutable sur une vraie base Postgres et déployable — sortir du mode démo local.

## ✅ Fait (cette semaine)
- Socle Next.js 16 + Auth.js v5 + Prisma 7 (driver adapter Postgres), incluant le correctif bloquant Prisma 7
- Sprint 1 — Profil AfroMaker éditable (`/dashboard/profile`)
- Sprint 2 — Communautés : liste, détail, création, rejoindre/quitter (`/communities`)
- Sprint 3 — Problem Hub : problèmes liste/détail/proposition (`/explorer`)
- Sprint 4 — Knowledge Hub : éditeur Markdown, brouillon → soumission → validation (`/knowledge`)
- Sprint 5 — Forum : questions/réponses, votes, réponse acceptée, commentaires (`/forum`)
- Sprint 6 — AfroAtlas : annuaire de solutions (`/atlas`)
- Sprint 7 — Recherche globale multi-entités (`/search`, Postgres)
- Sprint 8 — Admin & modération : validation, signalements, gestion des rôles (`/admin`)
- Page Paramètres du compte (`/dashboard/settings`) + correctif du lien de sidebar mort
- Lancement local vérifié : base autonome (`embedded-postgres`) + jeu de données de démo

## 🚧 En cours
- [ ] Arbitrer le travail non committé : versionner `prisma/migrations/` (migration `init`) et décider du sort de l'échafaudage DB jetable (`dev-db.mjs`, `seed.mjs`, dép `embedded-postgres`, `.gitignore`)

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
Committer la migration `prisma/migrations/…_init` (actuellement non versionnée) — sans elle, un clone neuf ne peut pas créer le schéma ; l'échafaudage DB local reste hors-commit.

## 🧱 Décisions verrouillées
- Next.js 16 (App Router, Server Actions) + React 19 ; architecture modulaire `features/<domaine>/` (actions + forms)
- Prisma 7 **avec driver adapter** (`@prisma/adapter-pg`) : `datasource.url` interdit dans le schéma, connexion via `prisma.config.ts` / `lib/db.ts`
- Auth.js v5, stratégie **JWT** (credentials + Google/GitHub) ; RBAC maison (`lib/permissions.ts`)
- Markdown First : rendu serveur sanitizé (`components/shared/markdown.tsx`)
- Recherche en Postgres pour l'instant ; Meilisearch prévu en upgrade

## ⚠️ Dettes / risques connus
- App **non vérifiée sur un vrai Postgres** : tout tourne sur une base jetable `embedded-postgres` (:5433, encodage WIN1252) ; pas de `.env` de production
- `prisma/migrations/` pas encore committé → un clone neuf ne peut pas initialiser le schéma
- `/search` liste les **membres sans lien** (pas de page profil public `/u/[username]`)
- Bouton **Signaler** câblé uniquement sur le forum (à généraliser aux autres contenus)
- OAuth Google/GitHub configurés mais **sans clés** → connexion sociale inactive
- `README.md` est encore le template create-next-app par défaut

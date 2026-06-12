# STATUS — AfroCodeurs
> Dernière MAJ : 2026-06-12

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
- Migration initiale Prisma versionnée (`prisma/migrations/…_init`)
- **PostgreSQL 18.4 réel installé** (binaires officiels EDB, espace utilisateur, sans admin) : `C:\Users\BEJ technologie\PostgreSQL`, port 5432, rôle/base `afrocodeurs` — app migrée (`migrate deploy`), seedée et vérifiée dessus (base jetable :5433 arrêtée)
- **Build de production validé** : `next build` vert (TS OK, 25 pages statiques, 28 routes) + `next start` vérifié sur :3001 (toutes pages 200 avec données réelles)
- `/opportunities` tranché : placeholder v1 **conforme au PRD produit V1**, texte aligné sur AfroOpportunities (emplois, stages, concours, bourses, financements) — module complet reporté en v2

## 🚧 En cours
- [ ] Retirer l'échafaudage DB jetable devenu inutile (`dev-db.mjs`, dép `embedded-postgres`, `.devdb/`) — `seed.mjs` reste utile (il a seedé la vraie base)

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
Construire la page profil public `/u/[username]` (bio, compétences, liens, contributions). Choisi car c'est le manque le plus visible restant : la recherche liste des membres sans lien, et le profil est le cœur d'une plateforme communautaire.

## 🧱 Décisions verrouillées
- Next.js 16 (App Router, Server Actions) + React 19 ; architecture modulaire `features/<domaine>/` (actions + forms)
- Prisma 7 **avec driver adapter** (`@prisma/adapter-pg`) : `datasource.url` interdit dans le schéma, connexion via `prisma.config.ts` / `lib/db.ts`
- Auth.js v5, stratégie **JWT** (credentials + Google/GitHub) ; RBAC maison (`lib/permissions.ts`)
- Markdown First : rendu serveur sanitizé (`components/shared/markdown.tsx`)
- Recherche en Postgres pour l'instant ; Meilisearch prévu en upgrade

## ⚠️ Dettes / risques connus
- Postgres local **sans démarrage automatique** (session non-admin, pas de service) : après un reboot, lancer `C:\Users\BEJ technologie\PostgreSQL\start-postgres.cmd`
- `/search` liste les **membres sans lien** (pas de page profil public `/u/[username]`)
- Bouton **Signaler** câblé uniquement sur le forum (à généraliser aux autres contenus)
- OAuth Google/GitHub configurés mais **sans clés** → connexion sociale inactive
- `README.md` est encore le template create-next-app par défaut

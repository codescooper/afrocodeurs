# STATUS — AfroCodeurs
> Dernière MAJ : 2026-06-13

## 🎯 Objectif de la phase actuelle
Ouvrir le projet à la contribution : le MVP est complet et tourne sur un vrai Postgres ; on outille la collaboration (commandes, docs, CI) avant le passage en open source.

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
- **Profil public `/u/[username]`** : identité, skills, liens, stats, contributions — et membres cliquables partout (recherche, forum, ressources, problèmes, atlas, communautés)
- **Relations problème ↔ solutions/ressources** (cœur du pitch) : la page problème liste les solutions (SOLVES) et ressources (EXPLAINS) liées, liaison/retrait par la communauté (`EntityRelation` enfin servi par l'UI)
- **Outillage collaboratif (OSS) — 1/n** : runner de commandes portable `./run` (start/build/test/lint/format/logs/deploy/clean/doctor, réutilisable toute stack, auto-détection + `run.config.json`) + `.gitattributes` (normalisation LF/CRLF)
- **Accueil open source — 2/n** : README **bilingue FR/EN** + CONTRIBUTING panafricains et accueillants (Build Before Consume, contributions sans code, langues africaines, esprit Ubuntu) ; `seed.mjs` de démo versionné pour l'onboarding. Commande globale `/awema-pre-commit-check` posée.
- **CI — 3/n** : workflow GitHub Actions (`.github/workflows/ci.yml`) — `./run lint` + `./run build` sur push/PR, Postgres de service + `migrate deploy` ; s'activera au 1ᵉʳ push GitHub
- **LICENSE (MIT) + CODE_OF_CONDUCT (Contributor Covenant 2.1) — 4/n** : repo prêt à être rendu public ; liés depuis README (FR/EN) et CONTRIBUTING
- **Templates GitHub — 5/n** : formulaires d'issue (bug, amélioration) + template de PR (rappelle de relier à un problème, checklist `./run`) → **outillage collaboratif complet**

## 🚧 En cours
- [ ] Retirer l'échafaudage DB jetable devenu inutile (`dev-db.mjs`, dép `embedded-postgres`, `.devdb/`) — `seed.mjs` reste utile (il a seedé la vraie base)

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
Rendre le dépôt public sur GitHub : créer l'organisation/dépôt, ajouter le remote, `git push`. Ça active la CI, les templates et les docs. Action côté mainteneur (compte GitHub) — l'outillage collaboratif est complet. Pré-vol : vérifier le détenteur du copyright (`LICENSE`) et que `conduct@afrocodeurs.org` route vers une vraie boîte.

## 🧱 Décisions verrouillées
- Next.js 16 (App Router, Server Actions) + React 19 ; architecture modulaire `features/<domaine>/` (actions + forms)
- Prisma 7 **avec driver adapter** (`@prisma/adapter-pg`) : `datasource.url` interdit dans le schéma, connexion via `prisma.config.ts` / `lib/db.ts`
- Auth.js v5, stratégie **JWT** (credentials + Google/GitHub) ; RBAC maison (`lib/permissions.ts`)
- Markdown First : rendu serveur sanitizé (`components/shared/markdown.tsx`)
- Recherche en Postgres pour l'instant ; Meilisearch prévu en upgrade

## ⚠️ Dettes / risques connus
- Postgres local **sans démarrage automatique** (session non-admin, pas de service) : après un reboot, lancer `C:\Users\BEJ technologie\PostgreSQL\start-postgres.cmd`
- Bouton **Signaler** câblé uniquement sur le forum (à généraliser aux autres contenus)
- OAuth Google/GitHub configurés mais **sans clés** → connexion sociale inactive
- CI invérifiable tant que le repo n'a pas de remote GitHub (le workflow s'activera au 1ᵉʳ push)
- `CODE_OF_CONDUCT.md` pointe vers `conduct@afrocodeurs.org` — s'assurer que cette adresse route vers une vraie boîte avant l'ouverture publique

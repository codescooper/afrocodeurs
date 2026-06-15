# STATUS — AfroCodeurs
> Dernière MAJ : 2026-06-14

## 🎯 Objectif de la phase actuelle
Projet **ouvert en open source** et **durci pour la production** (sécurité, légal/RGPD, SEO, tests). Reste : le **déploiement réel**, puis les fonctionnalités manquantes (médias, i18n, mentorat).

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
- **Bonus OSS** : `SECURITY.md`, `SUPPORT.md`, `.github/FUNDING.yml`, et `docs/good-first-issues.md` (idées de démarrage tirées du backlog, liées depuis CONTRIBUTING)
- **« Signaler » généralisé** : le contrôle de signalement couvre désormais ressources, problèmes, solutions et communautés (plus seulement le forum) — modération sur tous les contenus publics
- **Fix auth** : une session dont l'utilisateur n'existe plus est invalidée (revalidation du JWT à chaque résolution) — corrige les 500 sur clé étrangère (ex. Signaler après reseed) et propage aussitôt les changements de rôle
- **Modération complète + notifications** : page de traitement `/admin/reports/[id]` (aperçu du contenu signalé + actions Rejeter / Masquer / Supprimer qui agissent sur l'élément), et **notification au signaleur** de la décision (`/dashboard/notifications` + badge de non-lus dans la sidebar). Nouveau modèle `Notification` (migration)
- **Notifications sur tous les événements** (helper `notify()` centralisé, anti-auto-notification) : réponse à ta question, réponse acceptée, commentaire, ressource publiée/refusée, solution/ressource liée à ton problème, rôle modifié, contenu modéré, **nouveau membre dans ta communauté**
- **Cloche temps réel** : icône dans le header (connecté) avec compteur de non-lues, panneau déroulant et **toasts « push up »** (polling 15 s, `/api/notifications`)
- **Préférences + Web Push** : opt-out par catégorie (respecté par `notify()`) et **vraies notifications navigateur** (service worker, clés VAPID, abonnement, `web-push`) — réglages sur `/dashboard/notifications`. Au passage : `.env.example` corrigé (était masqué par `.env*`), échafaudage `embedded-postgres` retiré
- **Système de réputation** (« Build Before Consume ») : barème + niveaux (Curieux·se → Légende), attribution de points dans toutes les actions (question, réponse, réponse acceptée, commentaire, ressource publiée, problème, solution, relation, join, **upvotes reçus**), carte sur le profil, niveau sur le dashboard, **classement public `/afromakers`**
- **Infrastructure email** : transport pluggable (`lib/email.ts` — Resend si `RESEND_API_KEY`, sinon **log console en mode dev** avec le lien magique). **Mot de passe oublié** (`/forgot-password` → `/reset-password`, token 1 h) et **vérification d'email** (envoi à l'inscription, page `/verify-email`, renvoi depuis le dashboard) — tokens à usage unique dans `VerificationToken` (préfixes `reset:` / `verify:`)
- **Dépôt public sur GitHub** : https://github.com/codescooper/afrocodeurs (branche `main`) — **CI verte au 1ᵉʳ run** (lint + build + `migrate deploy` sur Postgres, ~1m20). Actions `checkout`/`setup-node` bumpées `@v5` (Node 24) + build CI sur Node 22
- **Durcissement avant lancement** : pages d'erreur 404/500 + `robots`/`sitemap`/OpenGraph ; **pages légales** (confidentialité/CGU/mentions) + bannière cookies + footer ; **anti-abus** (rate-limiting + CAPTCHA Turnstile, pluggables, no-op en dev) ; **email vérifié imposé** pour publier ; capture d'erreurs (`lib/observability`, Sentry-ready) ; **13 tests Vitest** ajoutés à la CI ; config de déploiement (`vercel.json` + `docs/DEPLOYMENT.md`)
- **Rétention — Tier 1 (plateforme vivante)** : **accueil** alimenté en temps réel (derniers problèmes/savoir, communautés actives, top AfroMakers, vraies stats) au lieu de « Bientôt disponible » ; **dashboard = feed personnel** (quoi de neuf, tes questions + nb de réponses, tes communautés) ; **compteurs de vues** sur problèmes/savoir/questions/solutions

## 🚧 En cours
- [ ] Vérifier le flux **Web Push** de bout en bout dans un vrai navigateur (autorisation + réception app fermée) — le code est en place, seule la partie navigateur reste à tester manuellement

## ⏭️ Prochaine étape (la SEULE chose à faire ensuite)
**Déployer sur Railway** : projet + service Postgres managé, variables d'env (régénérer les secrets, Resend domaine vérifié, Turnstile, `NEXT_PUBLIC_SITE_URL`), `prisma generate` au build + `prisma migrate deploy`, déployer. Base : `docs/DEPLOYMENT.md` (adapter Vercel → Railway). Ensuite : rétention Tier 2 (follow, save, digest hebdo, PWA installable).

## 🧱 Décisions verrouillées
- Next.js 16 (App Router, Server Actions) + React 19 ; architecture modulaire `features/<domaine>/` (actions + forms)
- Prisma 7 **avec driver adapter** (`@prisma/adapter-pg`) : `datasource.url` interdit dans le schéma, connexion via `prisma.config.ts` / `lib/db.ts`
- Auth.js v5, stratégie **JWT** (credentials + Google/GitHub) ; RBAC maison (`lib/permissions.ts`)
- Markdown First : rendu serveur sanitizé (`components/shared/markdown.tsx`)
- Recherche en Postgres pour l'instant ; Meilisearch prévu en upgrade

## ⚠️ Dettes / risques connus
- Postgres local : **conflit de port** — un autre Postgres (`C:\dev\pgsql`) reprend le 5432 au reboot, donc AfroCodeurs tourne sur **5433** (`.env` pointe dessus). Pas de démarrage auto : après un reboot, relancer le mien sur 5433 (`pg_ctl -D "…\PostgreSQL\data" -o "-p 5433" start`)
- OAuth Google/GitHub configurés mais **sans clés** → connexion sociale inactive
- **Rate-limiting en mémoire** : OK en mono-instance ; en serverless (Vercel) brancher un store partagé (Upstash) — cf. `docs/DEPLOYMENT.md`
- **Pages légales** : contenu de départ à faire relire + placeholders `[à compléter]` (éditeur, hébergeur)
- **Sentry** : hook prêt (`lib/observability`) mais `@sentry/nextjs` pas encore installé
- `CODE_OF_CONDUCT.md` pointe vers `conduct@afrocodeurs.org` — le repo est **public**, s'assurer que cette adresse route vers une vraie boîte

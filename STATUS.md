# STATUS — AfroCodeurs

**Dernière MAJ : 2026-08-06**
> Statut actualisé à partir du dépôt, de Railway, de GitHub Actions, de Resend et de contrôles HTTP réels.

## 🎯 Phase

**Pré-lancement public** : la plateforme est en ligne et techniquement stable, mais l'email transactionnel et l'identité légale de l'éditeur bloquent encore un lancement public sans restriction.

## ✅ Fait

- [x] Production Railway et PostgreSQL en ligne : `https://web-production-2b204.up.railway.app`.
- [x] Accueil, `robots.txt`, `sitemap.xml`, pages légales et API PoW vérifiés en HTTP 200 le 2026-07-15.
- [x] PoW actif en production (`POW_ENABLED=true`, widget client actif, difficulté 20) et Turnstile configuré.
- [x] Secret des crons renouvelé avec 32 octets aléatoires et synchronisé entre Railway et GitHub Actions.
- [x] Digest hebdomadaire et synchronisation des roadmaps exécutés avec succès via GitHub Actions (run `29426770349`).
- [x] Validation locale verte : ESLint, build Next.js 16.2.7 et 36/36 tests Vitest.
- [x] Hébergeur Railway renseigné dans les mentions légales à partir de ses informations officielles.
- [x] Avertissement de dépréciation Sentry supprimé de la configuration du build.
- [x] Page détail communauté : rangée d'avatars empilés `MembersRow` (tooltip, badge « +N », modale liste complète) ; shadcn `dialog`/`tooltip` ajoutés ; vérifié en dev le 2026-08-06 (tsc, ESLint, 40/40 Vitest, captures navigateur).

## 🚧 En cours / À faire

- [ ] Configurer un domaine d'envoi et le vérifier dans Resend ; aucun domaine n'est actuellement enregistré et `EMAIL_FROM` utilise `resend.dev`.
- [ ] Tester en production la réception de l'email d'inscription, de vérification et de réinitialisation avec une adresse externe.
- [ ] Renseigner l'identité/statut/adresse de l'éditeur, le directeur de publication et le droit applicable dans les pages légales.
- [ ] Confirmer que `contact@`, `privacy@`, `abuse@` et `conduct@` routent vers de vraies boîtes ; `afrocodeurs.org` ne résout pas actuellement en DNS.
- [ ] Confirmer la rotation des clés Resend et Turnstile précédemment exposées ; seule la rotation de `CRON_SECRET` est vérifiée ici.
- [ ] Configurer VAPID et tester Web Push de bout en bout si cette fonction doit faire partie du lancement.
- [ ] Configurer un stockage objet S3 avant de promouvoir l'upload de médias en production.
- [ ] Activer Sentry avant le lancement public, ou formaliser la surveillance des logs Railway comme solution temporaire.

## ⏭️ Prochaine action

**Choisir/configurer le domaine public, puis le vérifier dans Resend et effectuer un test réel de réception d'email.**

## ⚠️ Risques

- Sans domaine Resend vérifié, les emails transactionnels ne sont pas livrables à tous : inscription, vérification et récupération de compte sont dégradées.
- Les mentions légales restent incomplètes tant que l'identité de l'éditeur et du directeur de publication n'est pas fournie.
- Le stockage média local est éphémère sur Railway sans S3 ; Web Push, Sentry et OAuth sont inactifs faute de configuration.

## 🚦 Verdict de lancement

**GO pour une bêta contrôlée. NO-GO pour un lancement public large** tant que l'email transactionnel et les mentions légales ne sont pas finalisés.

## 🧱 Stack & structure

Next.js 16.2.7 (App Router) + React 19, Auth.js v5, Prisma 7/PostgreSQL, Vitest, Railway et GitHub Actions. Architecture modulaire `features/<domaine>/`, Server Actions protégées par les gardes centralisées de `lib/guard.ts`.

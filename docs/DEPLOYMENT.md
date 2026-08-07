# Déploiement — AfroCodeurs

Mise en production de l'app (Next.js 16 + Prisma 7 driver adapter + Auth.js v5).

## 1. Prérequis

- Une base **PostgreSQL managée** (Neon, Supabase, Railway, RDS…).
- Un hébergeur — **Vercel** recommandé (Next natif), ou Railway / Fly / VPS.

## 2. Variables d'environnement (production)

À définir dans le dashboard de l'hébergeur — **jamais dans le dépôt**.
⚠️ **Régénère tous les secrets** : ne réutilise pas les valeurs de développement.

| Variable | Requis | Note |
|---|---|---|
| `DATABASE_URL` | ✅ | URL Postgres managée (souvent `?sslmode=require`) |
| `AUTH_SECRET` | ✅ | **Régénérer** : `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ sur Railway | `true` — autorise Auth.js à utiliser l'hôte public transmis par le proxy Railway |
| `NEXTAUTH_URL` | ✅ | `https://ton-domaine` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://ton-domaine` (SEO, sitemap, liens des emails) |
| `RESEND_API_KEY` + `EMAIL_FROM` | ✅\* | **Indispensable** pour mot de passe oublié / vérification. Domaine expéditeur vérifié sur Resend |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | ✅\* | CAPTCHA anti-bot (Cloudflare Turnstile) |
| `VAPID_*` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⬜ | Notifications push. **Régénérer** : `npx web-push generate-vapid-keys` |
| `GOOGLE_*`, `GITHUB_*` | ⬜ | Connexion sociale — voir §2bis |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | Observabilité (cf. §6) |

\* L'app démarre sans, mais en mode dégradé : **pas de récupération de compte par
email** et **inscription non protégée**. À activer avant tout lancement public.

## 2bis. Connexion sociale (Google / GitHub OAuth)

Le code est prêt (`lib/auth.ts`) : les providers Google et GitHub sont déclarés
et les boutons « Continuer avec … » apparaissent sur `/login` et `/register`
**uniquement si les clés sont définies** (sinon ils sont masqués). À l'inscription
OAuth, un **username est généré automatiquement** (depuis le nom / la local-part de
l'email, collision-safe) et l'email est considéré **vérifié** (Google et GitHub
vérifient déjà les adresses).

**Créer une app OAuth par environnement** (dév. local ≠ production) :

- **GitHub** — `github.com` → Settings → Developer settings → OAuth Apps → New
  OAuth App :
  - Homepage URL : `https://ton-domaine`
  - Authorization callback URL : `https://ton-domaine/api/auth/callback/github`
- **Google** — `console.cloud.google.com` → (écran de consentement une fois, puis)
  Credentials → Create Credentials → OAuth client ID → Web application :
  - Authorized redirect URI : `https://ton-domaine/api/auth/callback/google`
  - En production, utilise un identifiant **« Testing »** avec des test users
    pendant la phase bêta, puis passe en « In production ».

Puis renseigne `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET` dans le dashboard de l'hébergeur.

### Deux cas d'usage

**Cas A — Instance officielle (`afrocodeurs.org`), recommandé pour la communauté.**

Les clés OAuth des mainteneurs sont définies **une seule fois côté serveur**
(dashboard Railway de l'app `web-production-2b204.up.railway.app`). Tous les
membres de la communauté les utilisent **directement, sans rien configurer** —
ils cliquent simplement « Continuer avec Google/GitHub » (modèle SaaS classique,
aucune clé ne quitte le serveur).

Une même app OAuth Google/GitHub accepte **plusieurs callback URLs** (dev
`localhost` + prod `afrocodeurs.org`) : il n'est pas nécessaire de créer de
nouvelles clés pour la production.

**Checklist de mise en ligne de l'instance officielle :**

- [ ] DNS : `afrocodeurs.org` pointe vers l'app Railway
      (`web-production-2b204.up.railway.app`).
- [ ] Console Google — OAuth client → **Authorized redirect URI** :
      `https://afrocodeurs.org/api/auth/callback/google`
      (en plus de `http://localhost:3000/...` si tu gardes le dev).
- [ ] Console GitHub — OAuth App → **Authorization callback URL** :
      `https://afrocodeurs.org/api/auth/callback/github`
- [ ] Railway — variables d'environnement :
      `NEXTAUTH_URL=https://afrocodeurs.org`,
      `NEXT_PUBLIC_SITE_URL=https://afrocodeurs.org`,
      `AUTH_TRUST_HOST=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, et un **`AUTH_SECRET`
      régénéré** (`openssl rand -base64 32`, distinct de celui du dev).

**Cas B — Fork auto-hébergé (un autre domaine).**

Contrainte imposée par Google/GitHub : un app OAuth ne valide que les callback
URLs **explicitement déclarées** pour son domaine. Réutiliser les clés de
l'instance officielle sur un autre domaine échoue avec `redirect_uri_mismatch`.
Chaque domaine doit donc avoir **ses propres apps OAuth** (suivre la procédure
ci-dessus avec `https://ton-domaine/...`). Sans clés, les boutons « Continuer
avec … » sont masqués (`features/auth/social-buttons.tsx`) et l'instance reste
utilisable en **email / mot de passe** — dégradation propre, aucun code à changer.

**Sécurité**
- Ne **jamais** committer ces secrets ni les partager ; `.env` est gitignoré.
- Portée demandée : uniquement `user:email` + `read:user` (GitHub) et
  `openid email profile` (Google) — nom, email, avatar. Aucun accès en écriture.
- En dev, teste avec un **compte secondaire** et des clés **dédiées au dev**
  (callback `localhost:3000`).

> ⚠️ Le gate d'accès `/construction` (easter egg) reste actif indépendamment de
> la connexion sociale : l'ouverture publique de la plateforme se décide à part
> (cf. `docs/BETA-CONTROLEE.md`). L'OAuth ne modifie pas ce comportement.

## 3. Build

`vercel.json` exécute `prisma generate && next build`. Sur un autre hébergeur,
configure la même commande de build.

## 4. Migrations

Applique le schéma sur la base de prod (une fois, puis à chaque évolution du
schéma) :

```bash
DATABASE_URL="<url_prod>" npx prisma migrate deploy
```

⚠️ **Ne lance jamais `node seed.mjs` en production** (données de démonstration).

## 5. Anti-abus en serverless

`lib/rate-limit.ts` est **en mémoire** : efficace pour un déploiement
**mono-instance** (VPS, conteneur). En **serverless multi-instances** (Vercel),
branche un store partagé (Upstash Redis) — l'interface `rateLimit()` ne change
pas. Le CAPTCHA Turnstile, lui, protège quel que soit l'hébergement.

## 6. Observabilité (Sentry)

`@sentry/nextjs` est **installé et câblé** : instrumentation serveur + edge
(`instrumentation.ts` → `sentry.server/edge.config.ts`), client
(`instrumentation-client.ts`), `onRequestError`, et `captureException()`
(`lib/observability.ts`) forwarde vers Sentry. Branché dans les error boundaries
`app/error.tsx` et `app/global-error.tsx`. **No-op tant qu'aucun DSN n'est
défini** — rien n'est envoyé en dev.

Pour activer en production, définis :

1. `NEXT_PUBLIC_SENTRY_DSN` — DSN du projet Sentry (lisible côté navigateur,
   c'est normal). Suffit pour capturer les erreurs **client et serveur**.
2. *(optionnel)* `SENTRY_DSN` si tu veux un DSN serveur distinct.
3. *(optionnel, traces lisibles)* `SENTRY_ORG`, `SENTRY_PROJECT`,
   `SENTRY_AUTH_TOKEN` — sans le token, l'upload des source maps est ignoré (les
   stack traces restent minifiées).

Les erreurs restent journalisées dans les logs serveur Railway, avec ou sans
Sentry.

## 7. Stockage des médias (images)

`lib/storage.ts` est **pluggable** : si `S3_ENDPOINT` / `S3_ACCESS_KEY` /
`S3_SECRET_KEY` / `S3_BUCKET` sont définis, les images uploadées (`POST
/api/upload`) vont dans un **stockage objet S3-compatible** (Railway, Cloudflare
R2, MinIO, AWS…) ; sinon, repli sur `public/uploads/` (**dev uniquement** — le
disque d'un conteneur est éphémère). Le bucket doit autoriser la **lecture
publique** (ou définis `S3_PUBLIC_URL` vers un CDN / domaine public). `S3_REGION`
vaut `auto` par défaut (R2). Upload réservé aux comptes avec **email vérifié**,
images ≤ 5 Mo (JPEG/PNG/WebP/GIF).

## 8. Checklist post-déploiement

- [ ] Connexion / inscription (avec CAPTCHA actif).
- [ ] Mot de passe oublié → email **réellement reçu**.
- [ ] Email de vérification reçu à l'inscription.
- [ ] `https://domaine/robots.txt` et `/sitemap.xml` répondent.
- [x] Pages légales : `/confidentialite`, `/conditions`, `/mentions-legales`.
- [x] Renseigner l'hébergeur Railway dans les mentions légales.
- [ ] Compléter l'identité de l'éditeur et du directeur de publication.
- [ ] `conduct@` / `privacy@` / `contact@` / `abuse@afrocodeurs.org` routent vers de vraies boîtes.
- [ ] Sauvegardes automatiques activées sur la base managée.

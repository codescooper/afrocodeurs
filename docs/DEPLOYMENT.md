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
| `NEXTAUTH_URL` | ✅ | `https://ton-domaine` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://ton-domaine` (SEO, sitemap, liens des emails) |
| `RESEND_API_KEY` + `EMAIL_FROM` | ✅\* | **Indispensable** pour mot de passe oublié / vérification. Domaine expéditeur vérifié sur Resend |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | ✅\* | CAPTCHA anti-bot (Cloudflare Turnstile) |
| `VAPID_*` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⬜ | Notifications push. **Régénérer** : `npx web-push generate-vapid-keys` |
| `GOOGLE_*`, `GITHUB_*` | ⬜ | Connexion sociale |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | Observabilité (cf. §6) |

\* L'app démarre sans, mais en mode dégradé : **pas de récupération de compte par
email** et **inscription non protégée**. À activer avant tout lancement public.

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

`lib/observability.ts` journalise déjà les erreurs (branché dans les error
boundaries `app/error.tsx` et `app/global-error.tsx`). Pour activer Sentry :

1. `npm i @sentry/nextjs`
2. Définis `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`.
3. Forwarde dans `captureException()` — **un seul point à modifier**.

## 7. Checklist post-déploiement

- [ ] Connexion / inscription (avec CAPTCHA actif).
- [ ] Mot de passe oublié → email **réellement reçu**.
- [ ] Email de vérification reçu à l'inscription.
- [ ] `https://domaine/robots.txt` et `/sitemap.xml` répondent.
- [ ] Pages légales : `/confidentialite`, `/conditions`, `/mentions-legales`.
- [ ] Compléter les `[à compléter]` des mentions légales (éditeur, hébergeur, directeur de publication).
- [ ] `conduct@` / `privacy@` / `contact@` / `abuse@afrocodeurs.org` routent vers de vraies boîtes.
- [ ] Sauvegardes automatiques activées sur la base managée.

# C01 - Inscription reproductible

## Changement

Les quatre patches auth presents seulement dans la construction serveur ont ete
repris et completes : champs controles en memoire, renouvellement des preuves apres
refus, rendu explicite Turnstile et verification serveur avec timeout de 10 secondes.
Le formulaire client est maintenant `features/auth/register-form.tsx`.

L'activation PoW et la cle publique Turnstile sont fournies par la page serveur a
chaque requete. Elles ne dependent plus de valeurs NEXT_PUBLIC figees au build.
Le secret ne quitte jamais le serveur. Aucune migration de base de donnees.

PoW : calcul borne a 60 secondes au lieu de 20 pour les machines plus lentes,
reessai sans perte de saisies, renouvellement automatique a expiration. Un retour
API incoherent ne debloque pas le bouton. Le calcul isole reussi lors de l'audit
ne permettait pas de determiner a lui seul la cause de tous les echecs du widget.

Turnstile : un token expire/erreur est retire, nouvelle verification apres erreur
metier, tentative de chargement sans recharger la page et sans perdre le formulaire.
Le mot de passe reste seulement dans l'etat React, jamais dans le stockage navigateur.

## Configuration requise avant livraison

- `TURNSTILE_SITE_KEY` : cle publique du widget actuel autorisant afrocodeurs.org.
- `TURNSTILE_SECRET_KEY` : secret correspondant a CE widget, gere hors Git.
- Le nom legacy `NEXT_PUBLIC_TURNSTILE_SITE_KEY` reste accepte au runtime.
- `POW_ENABLED=true` et `AUTH_SECRET` (ou legacy `NEXTAUTH_SECRET`) pour PoW.
- `POW_DIFFICULTY` conserve sa regle existante ; recette CI a difficulte 20.
- `NEXT_PUBLIC_POW_ENABLED` n'est plus utilise par l'inscription.

Cle publique sans secret, secret sans cle publique, activation invalide ou PoW
sans secret de signature : formulaire indisponible et `/api/health` retourne 503.
Cela doit bloquer la promotion d'une image incoherente, pas desactiver l'anti-robot.
Les parametres publics ne sont plus des ARG Docker de cette fonctionnalite.

**Attention production actuelle :** l'audit a trouve un secret Turnstile sans cle
publique. Renseigner la cle publique correspondant au widget avant de livrer cette
PR, sinon le service sera volontairement considere comme degrade. Ne pas reutiliser
une ancienne cle de conversation sans verifier sa validite et son association.

## Tests

- Tests config, readiness, timeout/refus prestataire, widgets, expiration/reessai,
  champs conserves et callbacks obsoletes.
- La CI construit SANS les cles publiques, puis demarre le serveur avec la config
  runtime : ce choix verifie que la correction n'exige pas une reconstruction
  specifique a chaque environnement.
- `scripts/signup-browser-qa.mjs` refuse toute origine/base non locale ou differente
  de constellation_test ; il refuse aussi une cle Resend et nettoie ses comptes.
- Recette : vraie enigme, PoW dans un vrai worker, CAPTCHA officiel de test,
  preuve manquante refusee, nom deja pris, conservation des champs, creation/session,
  consommation du token email et connexion depuis un second contexte navigateur.
- Cle et secret dummy fournis par la documentation officielle Cloudflare :
  https://developers.cloudflare.com/turnstile/troubleshooting/testing/
  Exclusivement dans la recette CI locale ; jamais pour un deploiement public.
- La verification email utilise le token du seul compte fixture dans la base
  isolee : elle ne prouve pas la reception d'un vrai email externe (lot C02).
- Chromium automatise ne prouve pas Safari/iOS/Android physique.

## Livraison et retour arriere

PR revue et CI verte avant fusion, sans bypass. Pas de deploiement dans ce lot de
preparation. Apres autorisation, sauvegarder la configuration et construire l'image
du commit fusionne sans patch serveur supplementaire. Configurer les cles runtime,
verifier readiness puis inscription avec une adresse de recette autorisee.
Si echec, ne pas supprimer la protection : revenir a l'image compatible precedente
et conserver les traces expurgees de secrets. Pas de rollback SQL necessaire.

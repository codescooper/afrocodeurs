# Connexion Google et GitHub

Lot #27 : parcours de connexion, inscription et association de comptes.
Aucune migration n'est necessaire. Les boutons sont absents tant que la paire
identifiant/secret du fournisseur n'est pas configuree au runtime.

## Configuration

Configurer dans le gestionnaire de secrets du serveur, jamais dans Git :

| Fournisseur | Variables | URL de retour exacte |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `https://afrocodeurs.org/api/auth/callback/google` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://afrocodeurs.org/api/auth/callback/github` |

Les noms Auth.js `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID` et
`AUTH_GITHUB_SECRET` sont aussi acceptes. Les noms historiques ci-dessus ont
priorite lorsqu'une paire complete est presente. Une paire incomplete n'est
jamais combinee avec l'autre convention de noms.
Configurer egalement `AUTH_SECRET`, `AUTH_TRUST_HOST` et `NEXTAUTH_URL` avec
l'origine HTTPS publique deja utilisee par l'application. Aucune variable
OAuth `NEXT_PUBLIC_*` n'est necessaire.

Creer une application OAuth chez chaque fournisseur. Pendant les essais,
respecter leurs restrictions de publication/utilisateurs de test. Les callbacks
de developpement (`http://localhost:<port>/api/auth/callback/...`) doivent etre
declares separement. Le secret de l'application GitHub OAuth n'est pas le
`GITHUB_TOKEN` utilise pour synchroniser les roadmaps.

## Politique des comptes

- Premiere connexion : pseudo aleatoire `maker_...`, email normalise et role
  USER par defaut. Aucun pseudo n'est derive de l'adresse email. Les collisions
  de pseudo sont retentees au plus trois fois ; une collision d'email n'est
  jamais fusionnee par l'adaptateur.
- Aucun compte ne doit etre associe uniquement parce qu'un fournisseur renvoie
  le meme email. Un membre existant se connecte avec sa methode habituelle,
  confirme son email AfroCodeurs puis choisit **Associer** dans les parametres.
- Une identite deja liee a un autre compte est refusee par Auth.js.
- Google doit retourner `email_verified: true`. GitHub doit fournir un email.
  L'adresse AfroCodeurs n'est pas marquee verifiee automatiquement : le membre
  utilise le lien de confirmation/renvoi deja disponible dans le dashboard.
- Le login GitHub est enregistre apres connexion reussie, avec l'identifiant
  utilisateur reel de la base, pour le rapprochement des contributions.
- Pas de retrait d'un fournisseur dans ce lot, pour ne pas rendre un compte
  inaccessible sans autre moyen de connexion.
- Les formulaires OAuth sont limites en frequence. Ils reposent sur les
  controles OAuth/Auth.js et du fournisseur, pas sur le CAPTCHA du formulaire
  d'inscription par mot de passe.

## Validation avant cloture de #27

Validation locale du 19 octobre 2026 : 105 tests passes, TypeScript, lint cible
et build Next.js 16.4 valides. Smoke HTTP sur le serveur standalone avec des
identifiants fictifs : les trois fournisseurs (credentials, Google, GitHub)
sont declares, les URLs de callback sont conformes et les secrets ne figurent
pas dans la reponse. Le portail de construction n'a pas ete contourne. Aucun
echange OAuth reel ni controle visuel du formulaire derriere ce portail n'a
ete realise ; ces validations restent requises.

Les tests unitaires couvrent configuration conditionnelle, creation du pseudo,
collisions, erreurs, gardes des actions et callbacks. Ils ne remplacent pas les
tests chez Google/GitHub avec les vraies applications :

1. Verifier `/login` et `/register` avec zero, un puis deux fournisseurs.
2. Creer un compte neuf via chaque fournisseur, puis se deconnecter/reconnecter.
3. Verifier pseudo, profil, role et confirmation email.
4. Avec un email deja inscrit par mot de passe, verifier le refus de fusion,
   puis l'association explicite depuis une session au mail confirme.
5. Refuser l'autorisation chez le fournisseur ; verifier le message et la
   conservation de la connexion email/mot de passe.
6. Verifier le refus d'une identite deja associee a un autre compte et d'une
   association depuis une session au mail non confirme.
7. Tester en mobile et sur ordinateur. Ne pas fermer l'issue avant validation
   de ces parcours avec les cles reelles, et ne pas afficher les secrets dans
   les captures, logs ou commentaires GitHub.

References : [OAuth Auth.js](https://authjs.dev/getting-started/authentication/oauth),
[politique des providers](https://authjs.dev/reference/core/providers),
[erreurs de liaison](https://authjs.dev/reference/core/errors#oauthaccountnotlinked).

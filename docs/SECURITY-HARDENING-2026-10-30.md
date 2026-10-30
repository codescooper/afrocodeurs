# Securisation comptes, sessions et push - 30 octobre 2026

Ce lot traite uniquement les trois priorites hautes de l'audit du 29 octobre.
Il ne constitue ni la correction de tous les autres constats ni un pentest complet.

## Comportement retenu

- Credentials : dix tentatives par adresse canonique sur cinq minutes, dans
  PostgreSQL, avant lecture du compte et bcrypt. Le formulaire et l'appel direct
  Auth.js utilisent la meme autorisation. Une variante de casse, un nouveau cookie
  ou un x-forwarded-for fourni par le client ne renouvelle pas le quota.
- Le formulaire conserve sa protection supplementaire par IP. Le quota de compte
  partage ne depend pas d'une adresse IP declaree par le client. Un compte peut
  temporairement etre bloque par des tentatives hostiles : le delai est borne,
  et le parcours de recuperation reste disponible. Le rate limiting de toutes les
  autres fonctions de la plateforme n'est pas remplace par ce lot.
- AuthRateLimit ne contient pas l'email en clair. Nettoyage indexe par lots de
  mille, au plus une fois par minute et processus, des entrees expirees depuis
  plus d'une heure. Une panne du limiteur refuse l'authentification, sans repli permissif.
- User.sessionVersion est copie uniquement lors d'une nouvelle connexion, puis
  compare a chaque resolution JWT. Un token ancien ou sans version est refuse.
- Reset : consommation du jeton et increment de sessionVersion dans une meme
  transaction ; un jeton deja consomme ne peut pas modifier de nouveau le mot de passe.
- Changement du mot de passe : comparaison de l'ancien, modification conditionnelle
  pour refuser un formulaire concurrent obsolete, increment de la version, invalidation
  des anciens liens de reset et deconnexion du navigateur courant. Une confirmation
  apparait sur la page de connexion.
- Le numero lu avant bcrypt est transporte jusqu'au callback JWT : une connexion
  Credentials qui chevauche un reset ne recoit pas silencieusement la nouvelle version.
- Push : HTTPS canonique, port standard, aucun identifiant URL ni fragment,
  hotes fournisseurs uniquement, cle P-256 valide et secret d'authentification de
  16 octets. Le corps JSON est limite a 8 Kio avant decodage.
- Controle DNS avant enregistrement et avant envoi. Toute reponse privee/reservee
  refusee ; l'adresse publique est epinglee dans un agent HTTPS pour l'envoi, sans
  seconde resolution DNS. Nom de serveur et verification du certificat TLS conserves.
- Cinq abonnements par compte, controle transactionnel verrouillant l'utilisateur.
  Une course d'insertion ne transfere pas l'abonnement d'un autre compte.
- Envoi : au plus cinq abonnements, trois en parallele, resolution limitee a deux
  secondes et envoi a cinq secondes (delai total et timeout socket). Les sockets
  de l'agent sont detruites a la fin, y compris lors d'un timeout.
- Les abonnements historiques sont revalides avant envoi ; ceux dont le format ou
  l'hote est interdit sont retires. Les erreurs 404/410 sont nettoyees pour le seul
  utilisateur concerne. Les erreurs transitoires ne declenchent pas de requete alternative.
- Le bouton d'activation affiche un refus du serveur au lieu d'annoncer a tort
  que l'abonnement a ete enregistre.

## Fournisseurs pris en charge

- FCM : fcm.googleapis.com.
- Firefox : updates.push.services.mozilla.com, selon la
  [documentation Autopush](https://mozilla-services.github.io/autopush-rs/http.html).
- Safari : hotes a un niveau sous push.apple.com, selon les contraintes reseau
  [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).
- WNS : hotes a un niveau sous notify.windows.com, compatibles avec les exemples
  [Microsoft](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/push-notifications/quickstart-send-push-notification).

Un autre service push necessite une modification de code revue, pas une URL libre
ni une variable de configuration autorisant n'importe quel domaine. Aucun chemin
de notification n'utilise de fournisseur choisi par l'utilisateur hors de cette liste.

## Deploiement

1. Sauvegarder la base et la configuration du service ; conserver l'image courante.
2. Appliquer `npx prisma migrate deploy` avec la configuration de production.
   Migration additive : `20261030090000_auth_session_security`, une colonne et une table.
3. Deployer le build incluant le nouveau client Prisma. Aucun nouveau secret ni
   service externe a installer pour ces corrections.
4. Prevenir les membres : les cookies preexistants, sans version de session,
   imposeront une nouvelle connexion une seule fois. Apres un changement de mot
   de passe, toutes les sessions, y compris la courante, seront fermees.
5. Verifier les parcours sur deux comptes de recette dedies : login, reset,
   deconnexion des deux appareils, reconnexion et notifications normales.
   Ne jamais envoyer de trafic de brute force ou de requetes internes en production.

Les donnees utilisateur et les mots de passe ne sont pas modifies par la migration.
Un retour a l'ancien binaire reste techniquement possible avec cette migration
additive, mais RETABLIT les anciennes faiblesses et doit etre decide explicitement.
Ne pas supprimer la colonne ou la table automatiquement lors d'un rollback.

## Verifications

```sh
npx prisma generate
npx prisma migrate deploy
npm test
npm run lint
npm run build
```

Les tests PostgreSQL utilisent uniquement une base localhost constellation_test
via CONSTELLATION_TEST_DATABASE_URL, et mentorship_test pour les tests existants.
Ils verifient trente tentatives concurrentes sur deux clients independants : dix
autorisations exactement, puis refus jusqu'a expiration de la fenetre.

```sh
DATABASE_URL=postgresql://test@127.0.0.1:5432/constellation_test \
SECURITY_QA_ORIGIN=http://127.0.0.1:3042 \
node scripts/security-browser-qa.mjs
```

Le serveur du build doit etre lance avec cette meme base isolee, AUTH_SECRET de
recette et NEXTAUTH_URL correspondant. Le script refuse les domaines non locaux
et les bases autres que constellation_test. Il cree et supprime ses comptes,
ses jetons et ses quotas ; il n'appelle aucun fournisseur push reel.

La recette HTTP teste deux vrais cookies, le reset via le formulaire, l'impossibilite
de reutiliser le lien, le changement dans Reglages et la revocation des autres
cookies, ainsi que le quota du callback Auth.js avec cookies et en-tetes changes.
Elle est ajoutee a la CI apres la recette Constellation, sur le build de production.

Resultats locaux avant ouverture de PR : 324 tests reussis sans test ignore,
33 migrations appliquees aux deux bases isolees, build Next/TypeScript reussi.
Lint sans erreur sur les fichiers du lot, quatre avertissements preexistants ;
trois anciens scripts de recette non suivis par Git sont exclus du controle local
et ne sont pas livres dans cette PR. Le serveur de recette local ayant ete bloque
par l'environnement, le resultat HTTP est a lire dans la CI et n'est pas anticipe ici.

Les anciennes preuves de l'audit restent locales, hors de cette PR : les assertions
qui reproduisaient les faiblesses ne sont pas des tests de non-regression securisee.

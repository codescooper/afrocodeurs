# Entree ludique dans AfroCodeurs

Direction validee le 6 novembre 2026 : retrouver l'enigme et son ambiance d'origine,
remplacer le discours "en construction" par une invitation a rejoindre la communaute,
et proposer a cote un acces "Simple visiteur".

## Parcours

- Premiere visite anonyme sur / : accueil ludique plein ecran, scene pixel-art,
  indices progressifs, deux choix clairs et lien de connexion.
- Simple visiteur : preference non identifiante memorisee 90 jours via cookie
  HttpOnly/SameSite=Lax. Aucun droit, compte ou acces au formulaire n'est attribue.
- Le contenu public de l'accueil reste rendu cote serveur ; aucune regle User-Agent,
  aucune redirection generale des moteurs. Les liens directs publics restent libres.
- Resolution : meme mecanisme serveur et meme sequence configuree, jamais exposee
  par les nouveaux indices. Le cookie de resolution seul ouvre l'inscription.
- Les membres authentifies ne voient pas l'entree et /construction les ramene a /.
- /construction reste une URL compatible pour jouer/rejouer avant inscription ;
  elle n'est plus presentee comme une page de chantier.
- Echap dans l'entree d'accueil choisit la visite. En cas d'erreur reseau, le choix
  est reessayable et un lien direct vers les projets reste disponible.
- La musique est uniquement sur demande. Le canvas reste statique avec reduced-motion.

## Regles preservees

Pas de modification du secret de l'enigme, des listes newsletter, de l'authentification,
de la moderation ou des protections anti-robot. Pas de migration. La PR #103 est
encore ouverte au debut de ce travail : cette evolution est separee de C01 et ne
reprend pas ses changements. Le choix visiteur ne remplace jamais la resolution.

## Recette

Tests unitaires : selection membre/visiteur/nouveau, cookie, refus cross-site,
priorite membre sur l'enigme resolue, indices et erreur/reessai reseau.
`scripts/community-entry-browser-qa.mjs` est limite a localhost/constellation_test :
accueil SSR, animations et captures 320/390/768/1440, visite persistante, enigme
reelle avec indice intermediaire, liens directs, Echap, membre connecte et reduced-motion.
Les comptes de test sont supprimes. La sequence de recette est propre a la CI,
aucune valeur de production n'est versionnee. Recettes existantes conservees.

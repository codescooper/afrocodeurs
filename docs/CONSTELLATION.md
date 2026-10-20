# Constellation

## Deux espaces complementaires

- Projets open source : contribuer au code, aux issues et a la roadmap GitHub.
- Constellation : decouvrir les produits et services deployes par les membres,
  trouver des competences et proposer des collaborations. GitHub est facultatif.

Une realisation peut etre commerciale, proprietaire, no-code ou open source.
Son auteur peut la relier a un projet open source dont il est responsable.
Le pays represente le pays de lancement declare, pas la nationalite du membre.

## Parcours

1. Un membre connecte avec email verifie renseigne sa realisation, son URL HTTPS,
   son pays, son secteur, ses besoins, un logo et jusqu'a trois captures.
2. La fiche passe en attente. Un autre membre de la moderation doit la valider.
3. Elle apparait dans la nuee et la liste, avec recherche et filtres serveur.
4. Le clic ouvre une fiche en overlay ; son URL directe ouvre une page partageable.
5. Les membres verifies peuvent commenter et envoyer une proposition privee.
6. Le porteur accepte ou refuse ; une proposition acceptee permet de rejoindre
   la messagerie existante. Les decisions generent des notifications selon preferences.

Les boutons de presentation invitent les membres a participer. Aucun envoi de
masse ni import automatique des projets GitHub n'est effectue.

## Confidentialite et moderation

- Fiches non publiees : auteur et moderation uniquement.
- Propositions : participants uniquement ; un signalement permet leur examen
  par la moderation. Aucun email ni texte de proposition n'est expose au public.
- Blocage bidirectionnel propre a Constellation ; il annule les collaborations
  en attente/acceptees. Il ne constitue pas un blocage global de la messagerie.
- Une seule proposition par membre et realisation ; apres decision definitive,
  aucune nouvelle proposition n'est possible dans cette premiere version.
- Une modification remet la fiche en attente. Une suspension empeche l'auteur
  de republier lui-meme ; la remise en ligne apres suspension reste une operation
  de moderation a traiter hors de cette interface initiale.
- Le libelle "Declare par" n'est pas une certification de propriete du domaine.
- Les URL sont validees mais jamais recuperees par le serveur pour creer un apercu.
- Medias acceptes uniquement sur le stockage d'upload configure. En production,
  utiliser un stockage persistant ; ne pas compter sur le disque ephemere du serveur.
- 18 fiches par page, alternative liste, animation suspendable et reduced-motion.

## Livraison et verification

Appliquer `prisma migrate deploy` avant de demarrer la nouvelle version. La
migration `20261020100000_add_constellation` ajoute trois tables et des enums,
sans convertir ni supprimer les projets GitHub existants.

Les tests PostgreSQL s'activent avec `CONSTELLATION_TEST_DATABASE_URL` sur une
base locale nommee `constellation_test`. Ils ne doivent jamais viser la production.
Les demonstrations navigateur sont uniquement dans cette base locale.

Recette : filtre pays/secteur/recherche, overlay et retour aux filtres, URL directe,
mobile/ordinateur sans collision, moderation independante, confidentialite des
propositions, refus/acceptation/annulation/blocage, commentaires et signalements.

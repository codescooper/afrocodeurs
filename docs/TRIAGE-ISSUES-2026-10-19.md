# Triage des issues - 19 octobre 2026

Base inspectee : `origin/main` au commit `21e6f27`. Six issues ouvertes,
aucune pull request ouverte lors de la consultation. Ce document decrit le
code du depot, pas une validation de la configuration de production.

| Issue | Constat | Suite et critere de validation |
| --- | --- | --- |
| #28 Partage et notifications WhatsApp | Aucun partage de contenu dans les pages detail. Ce lot ajoute WhatsApp, partage natif et copie du lien sur projets, ressources, questions, communautes, solutions, problemes et evenements. | Tester sur mobile et ordinateur. Garder l'issue ouverte : les notifications automatiques ne sont pas implementees. Elles demandent consentement, desinscription et un fournisseur configure. |
| #27 Google / GitHub OAuth | Providers declares, mais aucun bouton sur `/login`. `User.username` est obligatoire et l'adapter standard ne le renseigne pas. La liaison automatique par email est autorisee explicitement dans la configuration actuelle. | Implementer la creation atomique d'un pseudo unique, definir une politique de liaison sure, puis tester connexion initiale, retour, collision d'email et pseudo. Ne pas considerer l'ajout des cles comme suffisant. |
| #25 Interface anglaise | Deux propositions de participation dans les commentaires : boveldy et Ludovic130. Pas de PR ouverte. | Proposer un premier lot coordonne : choix du format de messages, structure des catalogues, navigation et authentification, puis expansion progressive. Ne pas attribuer la meme tache aux deux sans coordination. |
| #32 et #63 Meilisearch | Deux issues pour le meme chantier. #63 contient la proposition detaillee et une demande du mainteneur pour une PR strictement limitee a la recherche. Le code actuel utilise encore PostgreSQL ; le client Meilisearch n'est pas branche. | Conserver #32 comme reference fonctionnelle et #63 comme discussion contributive. Repli par index, purge des documents obsoletes, cron Bearer uniquement, aucun port public, tests de synchronisation et de repli. Ne pas fermer avant validation du travail. |
| #26 Mentorat | Demande large sans criteres d'acceptation dans l'issue. | Premier parcours propose : offre de mentorat (sujets, langue, disponibilite), demande motivee, acceptation/refus et notifications internes. Inclure blocage/signalement et ne pas exposer les coordonnees privees. |

## Verification du lot partage

- Neuf cas unitaires : URL publique, refus des liens externes et parametres
  sensibles, protocole, encodage du message WhatsApp et rendu serveur accessible.
- Suite complete : 80 tests passes. TypeScript et ESLint cible valides.
- Test interactif sur appareils reels encore a effectuer : partage natif,
  annulation, ouverture WhatsApp et refus de permission presse-papiers.
- Aucun appel WhatsApp avant une action de l'utilisateur ; aucun envoi automatique.
- Annuler le partage natif ne copie pas le lien a l'insu de l'utilisateur.
- Si le presse-papiers est indisponible, un champ selectionnable est propose.
- Les brouillons de defis ne recoivent pas de bouton de partage dans ce lot.
- Aucune cle ni dependance ajoutee, aucune migration.

## Dette separee

`npm audit` sur le lockfile existant signale neuf entrees de severite haute
dans les chaines ESLint/Prisma (plusieurs entrees peuvent remonter la meme
cause transitive). Aucun `audit fix --force` applique. Traiter dans une PR
dediee avec verification de compatibilite ; ce chiffre ne prouve pas neuf
failles exploitables sur le site public.

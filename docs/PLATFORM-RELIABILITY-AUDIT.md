# Audit de fiabilite - 26 octobre 2026

## Perimetre de la PR

- Constellation : auto-validation reservee au role ADMIN. Un moderateur ne peut
  toujours pas traiter sa propre fiche. Statut PENDING et revision courante
  obligatoires, y compris pour un administrateur. Une suspension ne peut pas
  etre levee par ce chemin.
- Chaque decision est journalisee dans la transaction de publication : acteur,
  ancienne/nouvelle revision, decision et indicateur d'auto-validation.
- Formulaires de saisie : composant commun `ActionForm` evitant le reset
  automatique des actions React lorsqu'une validation ou regle metier echoue.
  Aucun brouillon ni mot de passe n'est ecrit dans localStorage/sessionStorage.
- Couverture : authentification, compte, profil, ressources, problemes, projets,
  solutions, forum, communautes, evenements, opportunites, defis classiques,
  remuneration, signalements, suggestions et formulaires administratifs.
- Les formulaires mentorat et Constellation avaient deja un envoi explicite
  sans reset ; les messages du chat utilisent un envoi controle. Les recherches
  GET et les boutons sans saisie ne necessitent pas cette protection. Le champ
  de commande du terminal ludique conserve son comportement de terminal.
- Commentaires generiques : les refus de permission, cible, blocage et limite
  de debit produisent maintenant un message au lieu d'un echec silencieux.
- Les commentaires/reponses du forum sont effaces seulement apres un succes
  explicite. Le changement de mot de passe efface ses champs apres succes.
- Edition de contenu : confirmation visible apres enregistrement.
- Correctifs de dependances : Zod 4.6.7 et fast-uri 3.1.9 dans le lockfile,
  sans modification des autres dependances.
- CI : les suites PostgreSQL etaient ignorees faute d'URL de test. Deux bases
  dediees sont maintenant creees et migrees, puis utilisees par les tests
  Constellation, mentorat et chat. Le controle des dependances de production
  bloque aussi les alertes elevees, pas seulement critiques.

## Limites et points restant a traiter

Verification locale finale : installation propre, 240 tests reussis sans tests
ignores, 31 migrations sur chacune des deux bases isolees, build Next/TypeScript
reussi et lint sans erreur (quatre avertissements preexistants). Aucun probleme
de dependance signale par `npm ci`. La recette navigateur des nouveaux droits
reste a faire apres fusion/deploiement ; les tests de page ici sont rendus en test.

- Cette PR ne constitue pas un audit de securite exhaustif ni une recette
  navigateur de tous les parcours. Les tests DOM simulent les refus serveur ;
  les tests PostgreSQL controlent les transactions et autorisations couvertes.
- Les actions administratives historiques sans etat de retour peuvent encore
  echouer sans message. Leur saisie est protegee, mais il faut leur donner un
  contrat erreur/succes explicite avant de promettre un retour utilisateur complet.
- Les exceptions serveur inattendues et la fermeture/recharge volontaire d'une
  page ne sont pas une sauvegarde de brouillon. Ne pas stocker les secrets pour
  tenter de resoudre ce probleme.
- La limitation de debit est encore en memoire : evaluer un stockage partage
  avant de multiplier les instances web.
- Les issues GitHub ouvertes doivent etre retriees : mentorat, OAuth et partage
  WhatsApp ont deja du code ; une issue ouverte n'est pas une preuve d'absence.
  Meilisearch est demande deux fois (#32 et #63). L'anglais reste un chantier.

## Avant deploiement

1. Revue et CI sans contournement des protections de branche.
2. Sauvegarde base/configuration, preservation des uploads et des correctifs
   d'inscription actuellement presents sur le serveur. Verifier l'application
   de ce patch serveur contre la nouvelle page d'inscription avant bascule.
3. Aucune nouvelle migration : `AuditLog` existe deja.
4. Recette avec comptes dedies : admin sur sa fiche, moderateur sur sa fiche,
   refus serveur puis correction et nouvel envoi des formulaires principaux.
   Ne pas publier une fiche de test ni envoyer de notifications aux vrais membres.

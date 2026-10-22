# Mentorat communautaire - premier parcours (#26)

## Parcours livre

- `/mentorship` : annuaire pagine, recherche par titre/sujet et langue.
- `/mentorship/[id]` : offre publique, profil du mentor, disponibilite et places.
- `/dashboard/mentorship` : offre personnelle repliable, demandes recues/envoyees,
  decisions, suivi et liste des membres bloques pour le mentorat.
- Une offre par mentor ; entre une et cinq places simultanees. Publication,
  demande et decision de suivi exigent un compte dont l'email est confirme.
- La motivation reste privee aux deux participants, sauf consultation par la
  moderation lorsqu'un participant la signale. Aucun email/telephone de profil
  n'est selectionne dans l'annuaire ni transmis au formulaire.
- Demande PENDING, acceptation ACCEPTED, refus DECLINED, annulation CANCELLED,
  fin COMPLETED. Seul le mentor accepte/refuse/termine. Chacun peut annuler.
  Tous les etats terminaux sont definitifs dans ce premier parcours.
- Au plus cinq demandes en attente par apprenant et une demande au total par
  offre/apprenant, y compris apres refus, annulation ou deblocage. Pas de relance
  automatique ; plusieurs cycles avec le meme mentor seront un lot ulterieur.
- Apres acceptation, le bouton Discuter ouvre la messagerie interne existante.

## Securite et notifications

- Controle de session et verification email dans les actions ; l'identifiant
  acteur vient de la session, jamais du formulaire. Limite de frequence par membre.
- Transactions PostgreSQL Serializable, tentatives de reprise bornees, contraintes
  d'unicite et controle de capacite a l'acceptation. Notification interne creee
  dans la transaction, puis Web Push best-effort APRES commit, sans motivation
  privee dans la notification. Preferences de categorie Social respectees.
- Bloquer annule les demandes/suivis actifs dans les deux sens et interdit de
  nouvelles demandes entre les deux membres. Debloquer ne restaure rien. Ces
  commandes restent accessibles sans email confirme. Ce blocage est propre au
  mentorat : il ne bloque pas la messagerie globale existante.
- Signalement d'offre ou de demande integre a la moderation existante. Seuls les
  participants peuvent signaler une demande privee. Un apprenant peut signaler
  l'offre d'un suivi anterieur meme si elle a ete mise en pause.
- Masquer/supprimer une offre applique une suspension persistante et annule les
  demandes actives sans effacer l'historique. Le proprietaire ne peut pas lever
  la suspension en enregistrant de nouveau son offre. La suppression d'une demande
  par moderation l'annule sans effacer la motivation utile a l'examen.
- Aucun paiement, qualification certifiee, matching automatique, reservation de
  rendez-vous ou garantie d'accompagnement n'est ajoute par ce module.

## Migration et verification

Migration additive : `20261019090000_add_mentorship` (trois tables, un enum de
statut et deux nouvelles cibles de signalement). Appliquer par le processus
habituel `prisma migrate deploy` AVANT activation de l'image applicative revue.
Ne pas utiliser `db push`, `migrate reset` ou les fixtures de test en production.
Conserver une sauvegarde et l'image precedente ; ne pas supprimer les tables
du mentorat lors d'un retour arriere applicatif.

Validation locale du 19 octobre 2026 :

- Suite de tests avec PostgreSQL temporaire : 134 tests, dont six integrations
  reelles (cycle complet, capacite concurrente, doubles demandes, blocage,
  moderation persistante, refus d'un acteur tiers).
- Toutes les migrations installees sur une base jetable neuve, sans acces aux
  bases du projet. Le diff schema ne signale aucun ecart du mentorat ; un ecart
  preexistant sur le defaut `BrandSettings.updatedAt` subsiste et n'est pas corrige.
- Build Next.js 16.4, typage et lint cible verifies.
- Controle navigateur mobile avec deux comptes fictifs : annuaire, fiche,
  connexion, demande privee, badge notification, acceptation et ouverture de
  la conversation. Aucun compte ni message reel utilise.
- Web Push externe et rendu grand ecran restent a valider lors de la recette.

Tests PostgreSQL facultatifs, refuses si l'URL ne cible pas une base locale
nommee exactement `mentorship_test` :

```powershell
$env:DATABASE_URL = "postgresql://<user>@127.0.0.1:<port>/mentorship_test"
npx prisma migrate deploy
$env:MENTORSHIP_TEST_DATABASE_URL = $env:DATABASE_URL
npm test
```

Sans cette variable, les six tests d'integration sont ignores ; les tests
unitaires continuent a tourner. Ne pas clore #26 avant revue de la migration
et recette sur l'environnement cible.

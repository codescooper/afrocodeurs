# Atlas : catalogue et gestion verifiee

## Premiere version

- Enrichissement des fiches existantes, sans duplication automatique.
- Recherche par probleme/description, secteur, etat, pays d'utilisation, langue,
  licence et verification open source. Cent resultats maximum, filtres cumulables.
- Pays d'origine distinct des pays servis ; ancrage de l'equipe declare, jamais
  deduit d'un nom ou d'une photo. Aucun import massif ni attribution inventee.
- Liens existants Solution -> Projets -> Constellation conserves ; seules les
  realisations publiees et projets non archives sont lies publiquement.
- Licence verifiee exclusivement par ADMIN avec motif/source journalise.
  Un depot public seul ne suffit pas. Toute modification du depot ou du texte
  de licence invalide ce statut. Les anciennes fiches restent non verifiees.

## Reprise d'une fiche

1. Un membre avec email verifie demande la gestion et explique son lien avec le
   projet et ou verifier sa preuve. Le referencement initial ne donne aucun droit.
2. Apres demande, sa fiche affiche un code personnel a placer temporairement
   dans le depot ou sur le site officiel indique. Il doit attendre la decision.
3. Dans `/admin/atlas`, un autre ADMIN controle ce marqueur dans la source
   officielle ou documente une preuve independante equivalente. Il confirme la
   verification et motive sa decision. Un ADMIN ne traite pas sa propre demande.
4. Approbation : ajout d'un gestionnaire, jamais remplacement des autres.
   La decision et son motif sont journalises dans la meme transaction. Les
   decisions concurrentes ne peuvent pas accorder deux fois la meme demande.
5. Le demandeur consulte le resultat et son motif sur sa fiche. Une notification
   de compte respecte ses preferences ; son echec ne revient pas sur la decision.
6. Les gestionnaires verifies et ADMIN modifient les informations. Les versions
   empechent l'ecrasement d'une modification concurrente ; les saisies sont
   conservees en cas d'erreur. Le slug stable n'est pas modifie par le renommage.

Les preuves et motifs prives ne sont charges que pour le demandeur ou les ADMIN.
Ne jamais demander de mot de passe ou de cle. Aucun telechargement ni appel
automatique a l'URL fournie : pas de verifier reseau SSRF implicite.

## Moderation et limites explicites

- Une demande par membre et solution. Apres rejet, le membre peut fournir de
  nouvelles preuves et remettre cette meme demande en attente ; limite de debit
  conservee et nouvelle verification independante obligatoire.
- Plusieurs mainteneurs peuvent demander et recevoir leur acces independamment.
- Invitations et transferts accessibles aux gestionnaires depuis l'edition.
  Acceptation explicite dans `/dashboard/atlas`, expiration apres sept jours,
  refus et annulation. Aucun droit n'est accorde au simple envoi.
- Un transfert ajoute le destinataire puis retire seulement l'expediteur, dans
  la meme transaction. Les autres gestionnaires ne sont pas remplaces.
- Chaque membre peut quitter la gestion ; seul ADMIN retire l'acces d'un autre,
  avec motif et confirmation. Le dernier acces ne peut etre retire : effectuer
  un transfert accepte d'abord. Les invitations du gestionnaire retire sont annulees.
- Les operations d'equipe, l'edition et la validation des demandes utilisent
  le meme verrou de ligne Solution pour eviter les incoherences concurrentes.
  Acceptation impossible si l'expediteur a perdu ses droits entretemps.
- Verification GitHub automatique du marqueur via API officielle uniquement,
  aucun token utilisateur requis. Le fichier doit etre sur la branche par defaut
  a `.afrocodeurs/claims/<id-demande>.txt` et contenir le code personnel exact.
  Pas de redirection, URL reseau arbitraire ni telechargement non borne : 4 Ko,
  delai dix secondes. Le resultat est prive et ne dispense pas d'une revue admin.
  La verification OAuth des permissions GitHub n'est pas necessaire a ce parcours
  et n'est pas mise en place ; jamais de preuve basee sur un simple pseudo.
  Reference : https://docs.github.com/en/rest/repos/contents#get-repository-content
- Un litige est transmis par le signalement existant ou le contact de l'equipe.
  Pas de suppression de la fiche ni de retrait automatique d'un autre mainteneur.
- La licence doit etre examinee dans le vrai depot : compatible open source,
  texte applicable au code, source et date notees. Le statut n'est ni une garantie
  juridique ni une certification de securite ou de maintenance.
- Champs pays/langues libres, recherches exactes : normalisation ISO, pagination,
  captures et couts structures restent a ameliorer. Les contraintes/couts peuvent
  deja etre renseignes dans les besoins et la description.
- Limiteur de demandes en memoire : cinq demandes par heure et membre ; store
  partage necessaire avant un deploiement multi-instance.

## Deploiement

Migrations additives `20261026160000_solution_catalog_claims` et
`20261026170000_solution_team_invitations` obligatoires avant le
nouveau serveur. Les fiches existantes sont conservees ; aucune migration ne les
declare verifiees et aucun auteur ne devient automatiquement gestionnaire.
Sauvegarder la base avant migration. Ne pas deployer le code avant la migration.
Recette : referencer -> demander -> verifier independamment -> modifier ->
controler anonymement la fiche, les filtres et la confidentialite des preuves.

Recette navigateur locale reproductible (Playwright et Chrome installes) :
`node scripts/atlas-browser-qa.mjs`, avec `DATABASE_URL` dirige vers une base
locale isolee `constellation_test`, `ATLAS_QA_ORIGIN` vers le serveur local et
eventuellement `PLAYWRIGHT_MODULE` vers l'installation Playwright. Le script
refuse les cibles distantes, cree trois comptes de recette, puis les supprime
avec leur fiche et leurs journaux. Aucune invitation a un membre reel.

## Verification avant revue

- Suite de 288 tests reussie sans test ignore, dont deux integrations Atlas sur
  PostgreSQL, puis trois tests supplementaires de confidentialite reussis.
- Les 32 migrations passent sur les deux bases isolees. Le diff de schema ne
  signale pas d'ecart sur ce lot ; il signale le defaut historique de
  `BrandSettings.updatedAt`, qui n'est pas modifie dans cette migration.
- Build Next et TypeScript reussis dans un checkout a dependances propres.
  Premier essai dans le checkout de travail refuse par Turbopack car node_modules
  pointe hors de sa racine ; aucune modification de configuration pour le masquer.
- Lint sans erreur et quatre avertissements preexistants. Recette navigateur,
  revue des licences reelles, verification des demandes et production non faites.
- PR #100 en brouillon et dependante de #99. Ne pas fusionner cette branche dans
  celle de #99 : fusionner #99 d'abord, puis recibler #100 vers main et refaire la CI.

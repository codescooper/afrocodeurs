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

- Une demande par membre et solution, y compris apres rejet. En cas d'erreur,
  contacter l'equipe ; pas de boucle automatique de nouvelles demandes.
- Plusieurs mainteneurs peuvent demander et recevoir leur acces independamment.
- Les invitations de co-gestionnaires, transferts/revocations avec interface,
  verification OAuth du controle GitHub et reexamen d'un rejet sont des lots
  suivants. Aucun transfert de propriete intellectuelle n'est realise ici.
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

Migration additive `20261026160000_solution_catalog_claims` obligatoire avant le
nouveau serveur. Les fiches existantes sont conservees ; aucune migration ne les
declare verifiees et aucun auteur ne devient automatiquement gestionnaire.
Sauvegarder la base avant migration. Ne pas deployer le code avant la migration.
Recette : referencer -> demander -> verifier independamment -> modifier ->
controler anonymement la fiche, les filtres et la confidentialite des preuves.

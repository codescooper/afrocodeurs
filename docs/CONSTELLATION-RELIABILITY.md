# Constellation : mots-cles et parcours fiables

## Changements

- Mots-cles : virgules, points-virgules et retours a la ligne reconnus. Doublons
  retires sans tenir compte des accents/casse ; orthographe lisible conservee.
  C, C++ et C# acceptes. Six valeurs distinctes maximum, 50 caracteres chacune,
  300 caracteres au total. Erreurs explicites en francais et compteur de valeurs.
- Recherche Constellation : fragments de mots, accents et casse neutralises,
  plusieurs termes combines, nom/resume/description/besoins inclus. Pas de moteur
  de correction orthographique ni de promesse de recherche semantique.
- Recherche globale : nouvelle rubrique Constellation, uniquement fiches PUBLISHED
  et respect des blocages dans les deux directions. Aucun brouillon dans les
  resultats ou champs retournes.
- Editions avec controle de version : une ancienne page ne peut plus ecraser une
  modification recente. Les saisies restent presentes apres refus serveur.
- Une fiche publiee reste visible lors d'une edition : les nouvelles donnees vont
  dans pendingChanges jusqu'a validation. La moderation voit la proposition ;
  un refus conserve la version publique. L'archivage retire toujours la fiche.
  Le chargement de detail public omet pendingChanges et searchText.
- Les propositions terminees peuvent etre renouvelees : une minute apres
  annulation, sept jours apres refus. Date disponible affichee. Aucun renouvellement
  d'une demande en attente/acceptee, ni vers un membre bloque. Limites de debit et
  de demandes en attente conservees.
- Les dix propositions precedentes sont visibles des deux participants dans leur
  suivi. Les renouvellements sont aussi journalises dans AuditLog. Aucune teneur
  des messages n'est incluse dans les notifications ou les resultats publics.
- Version sur chaque proposition : une decision provenant d'une ancienne page ne
  s'applique pas a une nouvelle proposition reutilisant le meme identifiant.

## Migration et ordre de deploiement

Appliquer `20261027090000_constellation_reliability` avant le nouveau serveur.
Migration additive : searchText, pendingChanges, historique et version des
collaborations. Les fiches existantes gardent leur statut ; leur index textuel
est rempli a partir des champs publics actuels, sans extension PostgreSQL.

Une sauvegarde de base est requise avant migration. Tester le temps de backfill
sur une copie si le catalogue devient volumineux ; la recherche contains reste
une recherche SQL, pas un index plein texte dedie.

La branche repose sur main apres la fusion #99. Elle n'inclut pas la PR #100 Atlas.
Ne pas contourner les regles de revue. Aucun deploiement inclus dans ce travail.

## Recette

Tests unitaires : separateurs/limites, requetes de recherche et filtrage public.
Integrations PostgreSQL : edition publiee approuvee/refusee, concurrence, recherche
sans accents, renouvellement et delais, blocage et decision perimee.

Le script `scripts/constellation-browser-qa.mjs` cree trois comptes dedies et une
fiche sur localhost / constellation_test uniquement, puis nettoie ses fixtures.
Playwright et Chrome doivent etre disponibles ; PLAYWRIGHT_MODULE peut designer
une installation locale de Playwright. Variables : DATABASE_URL et facultativement
CONSTELLATION_QA_ORIGIN (defaut http://localhost:3042). Aucune action sur des membres
ou des services de production.

La CI installe uniquement Chromium headless puis execute ce script contre le
build de production, sur la base ephemere constellation_test. Les captures sont
jointes au run pour sept jours. Playwright est une dependance de developpement
epinglee ; aucun navigateur n'est ajoute a l'image de production.
Reference : https://playwright.dev/docs/ci

## Resultats verifies

- 271 tests locaux reussis sans tests ignores ; migration sur deux bases neuves.
- CI complete du code `3e40149` reussie : audit, migrations, lint, tests, build et
  recette Chromium sur le build de production. Execution :
  https://github.com/codescooper/afrocodeurs/actions/runs/40599122597
- Recette navigateur : formulaire invalide conserve, mots-cles et limites,
  moderation initiale, recherche locale/globale, modal mobile opaque et refermable,
  modifications publiques approuvees/refusees, brouillon non expose, version
  concurrente refusee, collaboration annulee puis renouvelee avec historique.
- Les essais Chrome locaux ont rencontre un manque d'espace disque et ont ete
  completes par la recette CI. Aucun deploiement de ces correctifs n'a ete fait.

Apres fusion/deploiement : refaire recherche par fragment/sans accents, formulaire
invalide conservant ses valeurs, publication/modification/refus, fenetre mobile,
renouvellement et verifications d'appartenance avec comptes de recette dedies.

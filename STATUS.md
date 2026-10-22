# STATUS — AfroCodeurs

**Dernière MAJ : 2026-10-22**
> Le triage du 19 octobre porte sur origin/main (21e6f27). Les constats historiques ci-dessous sur Railway et les services externes ne constituent pas un audit actuel de production.

## Fiabilisation Constellation - 22 octobre 2026

- PR #91 fusionnee ; son deploiement durable reste a verifier. Aucun deploiement effectue dans ce lot.
- PR avatars : le dock utilise maintenant une vraie image de taille fixe, avec initiales contrastees si absente ou inaccessible. Le compteur sort du cercle sans etre rogne.
- Formulaire de fiche et messages de collaboration conserves apres une erreur serveur ; double envoi bloque apres succes. Le test DOM a reproduit puis valide la correction des selections remises a zero.
- Partage public affiche uniquement pour les fiches publiees, sans modifier les droits de moderation.
- Port interne Docker change de 4190 (bloque par Fetch) a 3000. Adaptation du compose externe de production indispensable : procedure et retour arriere dans `docs/CONSTELLATION-DEPLOY-FIXES.md`.
- 138 tests passes (suite de 137 puis test du dock), lint cible et build de production Next/TypeScript reussis. Neuf tests PostgreSQL non executes : cluster temporaire local incomplet (`pg_notify` absent). Recette navigateur et production encore requises.

## Livraison Constellation - 21 octobre 2026

- PR #89 puis correctif #90 fusionnes ; version `2026dd4` deployee. Migration Constellation appliquee, sauvegarde prealable disponible, medias et correctifs d'inscription preserves.
- Build de production et CI reussis. Controle HTTP : application et base `ok`.
- Recette navigateur en production : les deux boutons "Presenter ma realisation" ouvrent `/constellation/new` avec le formulaire visible, sans 404.
- Annonce publiee dans les nouveautes du site avec le mecanisme de notification des membres ; invitation envoyee et distribuee dans le groupe WhatsApp AfroCodeurs.org.
- Aucun envoi email de masse, aucune annonce Discord effectuee. Aucun exemple fictif ajoute en production. Le portail de construction reste actif pour les nouveaux visiteurs.
- La beta attend les premieres fiches pour la moderation independante et les premiers retours reels. Les scenarios de collaboration ont ete testes sur base isolee ; aucun echange fictif entre membres reels n'a ete cree pour la recette de production.

## Correctif images - 21 octobre 2026

- Fiche La Ruche Digitale AwemA soumise sous @codescooper avec logo et capture ; validation independante encore requise.
- Diagnostic : fichiers presents sur le volume persistant mais nouvelles URL `/uploads` en 404, car absentes du manifeste public de build Next. Route de lecture runtime ajoutee avec types limites, controle du chemin reel et protection contre les liens symboliques sortants ; portail de construction inchange.
- Avatars de session recharges depuis la base sans reintroduire l'image dans le JWT ; affichage ajoute a la sidebar et URL CSS correctement delimitee.
- Remise en service provisoire : redemarrage du seul web, logo existant a nouveau visible et fichier charge dans le navigateur, sante application/base HTTP OK. Aucun fichier perdu ni nouvel upload requis.
- 126 tests passes, neuf tests PostgreSQL non executes faute de base de test active. Lint cible et build Next/TypeScript reussis sans avertissement de tracage des fichiers runtime. Correctif durable non deploye, en attente de revue et fusion.

## Lot issues - 19 octobre 2026

- Six issues ouvertes inspectees, aucune PR ouverte au moment du triage.
- #28 : partage WhatsApp, partage natif et copie du lien ajoutes a sept types de pages publiques. Notifications WhatsApp non implementees : issue a conserver ouverte.
- Coordination des propositions anglaises (#25) et Meilisearch (#32/#63) preservee ; details et criteres dans `docs/TRIAGE-ISSUES-2026-10-19.md`.
- #27 : activation OAuth insuffisante sans gestion du pseudo obligatoire et verification de la liaison des comptes.
- Neuf alertes npm audit sur le lockfile existant, a traiter dans un lot separe sans mise a jour forcee.
- Verification initiale du lot : TypeScript, lint cible et build Next.js 16.4 verts. Revue #86 : detection des annulations de partage sans dependance au prototype Error corrigee ; 81 tests passent. Validation interactive mobile/ordinateur encore a effectuer.
- PR #86 fusionnee par le mainteneur puis deployee le 19 octobre. Controles publics application/base et livraison des bundles reussis ; correctifs d'inscription preserves. Test interactif mobile encore a faire.

## Lot OAuth #27 - 19 octobre 2026

- Connexion/inscription : boutons Google et GitHub uniquement si une paire complete de cles est configuree. Variables historiques et noms Auth.js standards acceptes sans melanger les paires.
- Adaptateur : creation du pseudo obligatoire, email normalise, collisions de pseudo bornees et aucune fusion d'email automatique.
- Comptes existants : liaison explicite dans les parametres apres confirmation email ; controle egalement au callback. Login GitHub sauvegarde apres creation/connexion reussie.
- Aucun changement du formulaire anti-robot d'inscription ni du schema de base. Documentation de configuration et recette : `docs/OAUTH.md`.
- 105 tests, TypeScript, lint cible et build de production passent. Smoke HTTP du build standalone avec identifiants fictifs : trois providers declares, callbacks conformes, secrets absents de la reponse et gate construction preservee. Serveur de test arrete apres verification.
- Activation et recette reelle chez Google/GitHub encore a effectuer ; aucun deploiement de ce lot, ne pas clore #27 avant ces validations.

## Lot Constellation - 20 octobre 2026

- Catalogue de realisations deployees separe des projets open source GitHub : nuee de bulles, drapeaux locaux, recherche pays/secteur, vue liste et fiches en overlay partageables.
- Depot par membres verifies, validation independante par moderation, modification remise en attente, signalement et suspension. Aucun envoi de masse aux membres.
- Commentaires, propositions privees, decisions notifiees et blocage bidirectionnel propres a Constellation. Messagerie existante accessible apres acceptation.
- Migration additive testee sur base PostgreSQL locale isolee. Documentation : `docs/CONSTELLATION.md`.
- Verification finale : 127 tests passes, dont neuf tests PostgreSQL ; lint cible et build Next.js 16.4 (TypeScript inclus) reussis.
- Recette navigateur : ordinateur 1440px et mobile 390px, aucune collision des 18 bulles ; filtres conserves au retour de l'overlay, URL directe sans modale, vue liste fonctionnelle. Debordement de l'en-tete mobile corrige.
- Limites : une proposition par membre/realisation ; pas de preuve automatique de propriete du domaine ni interface de remise en ligne apres suspension. Recette complete des formulaires connectes encore a effectuer.
- Non deploye. PR mentorat #88 toujours ouverte et distincte de ce lot.
- Livraison demandee : PR #89 verte en CI, mais approbation independante obligatoire avant fusion. Correctif de concurrence a l'ouverture des discussions ajoute avec trois tests de regression ; annonce communautaire retenue jusqu'au controle de production.
- PR #89 fusionnee puis deployee avec migration additive et sauvegarde prealable. Correctifs d'inscription existants preserves. Application et base confirment leur sante via HTTP.
- Recette en production : page Constellation et formulaire direct accessibles, mais le bouton de creation en navigation Next est intercepte comme un slug et produit une 404. Correctif par navigation documentaire propose ; annonce non envoyee tant que ce point n'est pas livre.

## 🎯 Phase

**Pré-lancement public** : la plateforme est en ligne et techniquement stable, mais l'email transactionnel et l'identité légale de l'éditeur bloquent encore un lancement public sans restriction.

## ✅ Fait

- [x] Navigation publique passée en **sidebar verticale** (desktop) : `components/layout/site-sidebar.tsx` + `site-sidebar-nav.tsx`, liens avec icônes et état actif, section utilisateur (Connexion/Rejoindre ou @username + Déconnexion) centrée et en pleine largeur en bas de la sidebar. Header horizontal supprimé (`main-nav.tsx`), `SiteHeader` allégé en en-tête compact mobile (`md:hidden`), `NotificationBell` gagne une prop `align`. Vérifié : lint + build + 54/54 tests Vitest + rendu HTTP 200 des pages publiques.
- [x] Production Railway et PostgreSQL en ligne : `https://web-production-2b204.up.railway.app`.
- [x] Accueil, `robots.txt`, `sitemap.xml`, pages légales et API PoW vérifiés en HTTP 200 le 2026-07-15.
- [x] PoW actif en production (`POW_ENABLED=true`, widget client actif, difficulté 20) et Turnstile configuré.
- [x] Secret des crons renouvelé avec 32 octets aléatoires et synchronisé entre Railway et GitHub Actions.
- [x] Digest hebdomadaire et synchronisation des roadmaps exécutés avec succès via GitHub Actions (run `29426770349`).
- [x] Validation locale verte : ESLint, build Next.js 16.2.7 et 36/36 tests Vitest.
- [x] Hébergeur Railway renseigné dans les mentions légales à partir de ses informations officielles.
- [x] Avertissement de dépréciation Sentry supprimé de la configuration du build.
- [x] Page détail communauté : rangée d'avatars empilés `MembersRow` (tooltip, badge « +N », modale liste complète) ; shadcn `dialog`/`tooltip` ajoutés ; vérifié en dev le 2026-08-06 (tsc, ESLint, 40/40 Vitest, captures navigateur).

## 🚧 En cours / À faire

- [ ] Configurer un domaine d'envoi et le vérifier dans Resend ; aucun domaine n'est actuellement enregistré et `EMAIL_FROM` utilise `resend.dev`.
- [ ] Tester en production la réception de l'email d'inscription, de vérification et de réinitialisation avec une adresse externe.
- [ ] Renseigner l'identité/statut/adresse de l'éditeur, le directeur de publication et le droit applicable dans les pages légales.
- [ ] Confirmer que `contact@`, `privacy@`, `abuse@` et `conduct@` routent vers de vraies boîtes ; `afrocodeurs.org` ne résout pas actuellement en DNS.
- [ ] Confirmer la rotation des clés Resend et Turnstile précédemment exposées ; seule la rotation de `CRON_SECRET` est vérifiée ici.
- [ ] Configurer VAPID et tester Web Push de bout en bout si cette fonction doit faire partie du lancement.
- [ ] Configurer un stockage objet S3 avant de promouvoir l'upload de médias en production.
- [ ] Activer Sentry avant le lancement public, ou formaliser la surveillance des logs Railway comme solution temporaire.

## ⏭️ Prochaine action

**Faire revoir les PR de fiabilisation (avatars puis Constellation) avant de deployer avec la configuration de ports adaptee.**

## ⚠️ Risques

- Sans domaine Resend vérifié, les emails transactionnels ne sont pas livrables à tous : inscription, vérification et récupération de compte sont dégradées.
- Les mentions légales restent incomplètes tant que l'identité de l'éditeur et du directeur de publication n'est pas fournie.
- Le stockage média local est éphémère sur Railway sans S3 ; Web Push, Sentry et OAuth sont inactifs faute de configuration.

## 🚦 Verdict de lancement

**GO pour une bêta contrôlée. NO-GO pour un lancement public large** tant que l'email transactionnel et les mentions légales ne sont pas finalisés.

## 🧱 Stack & structure

Next.js 16.2.7 (App Router) + React 19, Auth.js v5, Prisma 7/PostgreSQL, Vitest, Railway et GitHub Actions. Architecture modulaire `features/<domaine>/`, Server Actions protégées par les gardes centralisées de `lib/guard.ts`.

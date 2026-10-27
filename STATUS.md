# STATUS — AfroCodeurs

**Dernière MAJ : 2026-10-27**
> Le triage du 19 octobre porte sur origin/main (21e6f27). Les constats historiques ci-dessous sur Railway et les services externes ne constituent pas un audit actuel de production.

## Correctifs Constellation et mots-cles - 27 octobre 2026

- Branche dediee `codex/fix-constellation-keywords`, base main `15e540e` apres
  fusion #99. PR Atlas #100 non incluse ; changements AGENTS.md generes par Next
  laisses hors du correctif.
- Separateurs et doublons de mots-cles normalises, C accepte, limites explicites
  en francais. Recherche partielle sans accents sur texte public et besoins,
  ajoutee a la recherche globale avec filtre de publication et blocages.
- Edition versionnee ; une fiche deja publiee reste visible jusqu'a approbation
  de ses modifications. Refus sans retrait de l'ancienne presentation publique.
- Renouvellement des collaborations terminees avec delai et historique prive,
  controle de version des decisions et maintien des protections anti-abus.
- Migration additive preparee et appliquee sur deux bases locales isolees.
  Suite de 271 tests reussie sans tests ignores ; lint sans erreur (quatre
  avertissements preexistants). Recette Chrome et build final en verification.
- Documentation : `docs/CONSTELLATION-RELIABILITY.md`. Aucun deploiement effectue.

## Decouverte publique et SEO - 26 octobre 2026

- Suite decouverte : page publique `/participer`, parcours de premiere contribution,
  lien dans le pied de page et sitemap. Plan editorial, partenariats, mesure
  respectueuse et actions externes documentes dans `docs/DISCOVERY-LAUNCH.md`.
- Controle apres deploiement disponible : `node scripts/check-public-discovery.mjs`.
  Aucun envoi communautaire, outil de tracking, validation Search Console/Bing ni
  deploiement realise par ce lot. Les actions externes restent explicitement ouvertes.
- Verification de ce lot : quatre tests du controle de deploiement et trois tests
  de rendu public reussis ; lint cible et `git diff --check` sans erreur.
  Le controle lui-meme est ajoute a la CI ; aucune recette production anticipee.

- Ajout a la PR #99, sur demande explicite : l'enigme ne concerne plus que l'inscription. Les pages publiques sont accessibles sans cookie ; les controles Auth.js et RBAC des espaces prives sont conserves. Apres resolution, redirection vers `/register`.
- Presentation publique `/a-propos`, accueil explicite, donnees structurees factuelles, metadata par rubrique/fiche, URL canoniques et image PNG de partage. Sitemap filtre selon la publication ; pages privees et formulaires hors indexation.
- Constellation lisible en HTML serveur avant JavaScript. Messages communautaires non charges pour les anonymes/non-membres ; filtre invalide de l'annuaire neutralise.
- Configuration Google/Bing et procedure apres deploiement dans `docs/SEO-DISCOVERY.md`. Aucune propriete externe verifiee ni indexation garantie. Changements non deployes.
- Commit SEO `292cbc7` : CI GitHub complete reussie (audit, migrations, bases d'integration, lint, tests et build), execution `40278336218`. Dix-sept tests SEO/publication cibles reussis localement et controle TypeScript reussi. La suite locale complete a rencontre des depassements de delai ; elle a ete arretee, ainsi que le build local redondant apres validation de la CI. Ces interruptions ne sont pas presentees comme des succes locaux.

## Fiabilite des formulaires et droits Constellation - 26 octobre 2026

- En branche de revue : auto-validation Constellation reservee aux ADMIN, restriction maintenue pour les moderateurs sur leur propre fiche. Decisions journalisees dans la transaction ; version et statut PENDING toujours controles.
- Protection commune des saisies dans 35 surfaces de formulaire, sans stockage persistant des brouillons ou mots de passe. Commentaires generiques avec messages de refus explicites ; confirmation d'enregistrement des modifications de contenu.
- Dependances verrouillees : Zod 4.6.7 et fast-uri 3.1.9. CI renforcee pour bloquer les alertes elevees et activer les tests PostgreSQL jusque-la ignores faute de bases dediees.
- Verification sur installation propre : 240 tests reussis sans tests ignores, 31 migrations appliquees a chacune des deux bases PostgreSQL isolees, build Next/TypeScript reussi, lint sans erreur (quatre avertissements preexistants). `npm ci` ne signale aucune vulnerabilite. Audit et limites dans `docs/PLATFORM-RELIABILITY-AUDIT.md`.
- PR #99 preparee : `https://github.com/codescooper/afrocodeurs/pull/99`. Revue independante et CI requises ; protections de branche conservees.
- Aucun nouveau deploiement de ces changements, aucune nouvelle migration. L'ancien depot Git local n'etant plus disponible, correctifs recuperes dans `C:/Users/BEJ technologie/.codex/worktrees/afrocodeurs-recovery` depuis une copie propre de main.

## Recette mentorat de la PR #98 - 23 octobre 2026

- Fusion `5eeba3e` deployee : image `afrocodeurs-web:chat-presence-5eeba3e-20261023t093639z`. Sauvegarde dans `/opt/afrocodeurs/backups/chat-presence-20261023T093639Z`. Aucun changement de schema requis ; application et base ok apres bascule.
- Chrome en production : soumission avec sujet trop court refusee en francais ; titre, description, langues, disponibilite, capacite 3 et case decochee conserves. Aucune offre de test publiee.

## Annuaire du chat et fermeture des bulles - 23 octobre 2026

- PR #97 fusionnee (`f2ad4c4`) et deployee : image `afrocodeurs-web:chat-presence-f2ad4c4-20261023t083850z`, migration `20261023060000_add_chat_presence` appliquee. Application et base ok, conteneur healthy. Sauvegarde dans `/opt/afrocodeurs/backups/chat-presence-20261023T083850Z` ; patch inscription et volumes preserves.
- Recette Chrome production : panneau Chat, recherche, compte dedie A en ligne et B hors ligne, fermeture de bulle conservee apres rechargement, reouverture via recents, general ouvert sans quitter la page et brouillon conserve pendant navigation vers Ressources. Brouillon efface sans envoi.
- Nouvelle recette HTTP production A/B : authentification, envoi/reponse, reception incrementale, non-lus et lecture reussis ; comptes de test desactives ensuite.
- Correctif mentorat prepare separement : saisies conservees apres rejet serveur (offre et demande), erreurs de validation en francais. 22 tests cibles, TypeScript et lint cibles reussis ; pas encore deploye.

- Test reel en production avec deux comptes USER dedies et authentification normale : envoi A/B, reponse B/A, reception incrementale, compteur non lu et lecture valides. Aucun membre reel sollicite ; acces des comptes de test desactive en fin de recette.
- Bouton Chat ouvrant general, membres en ligne et hors ligne ; recherche et pagination. Discussion compacte accessible aussi pour un membre hors ligne, sans message envoye au simple clic. Recents repliables pour retrouver les groupes et salons masques.
- Croix des bulles et fenetres : masque sans supprimer les conversations ; fermeture conservee dans cet onglet, nouvelle bulle seulement pour nouveau message entrant non lu ou ouverture volontaire.
- Presence limitee a l'activite d'un onglet visible ; signal toutes les 30 s et expiration a deux minutes. Ni email ni heure exacte d'activite exposes par l'annuaire ; pas de geolocalisation.
- Migration additive `ChatPresence` testee avec les 31 migrations sur deux bases PostgreSQL locales isolees. 206 tests passent sans tests ignores ; build Next/TypeScript et lint cible reussis.
- Documentation : `docs/CHAT-PRESENCE.md`. La recette initiale avant fusion a ete completee par les controles production decrits ci-dessus.

## Deploiement verifie - 23 octobre 2026

- PR #96 fusionnee ; SHA `96894eb` deploye avec les correctifs d'inscription serveur preserves. Image `afrocodeurs-web:chat-overlays-96894eb-20261023t032242z`.
- Sauvegardes base/configuration/patch inscription dans `/opt/afrocodeurs/backups/chat-overlays-20261023T032242Z`. Migration additive mentorat appliquee ; volumes conserves.
- Port interne 3000 et mapping hote 14190 adaptes. La cible Traefik externe pointait encore vers 4190 : erreur 502 transitoire corrigee par mise a jour du seul upstream AfroCodeurs, sauvegarde du proxy incluse.
- Controle final : conteneur healthy, HTTP public 200, application/base ok ; aucun message Error/bad port/PrismaClientKnownRequestError dans les logs du nouveau web pendant la recette.
- Recette Chrome connectee en production : recherche de membres opaque en clair/sombre, photo Dylan chargee, six photos communautaires chargees, menus utilisateur/mobile opaques, logo existant 1254x1254 lisible avec la session autorisee.
- Fenetres privee/generale/communautaire ouvertes sans navigation ; brouillon communautaire conserve apres navigation vers Ressources et reduction/reouverture ; ouverture page complete et ancien lien communautaire fonctionnels. Brouillon de test efface, aucun message reel envoye.
- Les trois recents du compte teste n'ont pas de photo : initiales contrastees affichees, pas de photo inventee. La recette ne couvre pas l'envoi reel entre deux comptes.

## Surfaces superposees - 23 octobre 2026

- Cause mesuree dans Chrome sur la recherche de membres en production : fond `rgba(0, 0, 0, 0)` ; tokens `popover` absents du theme.
- Correction globale des couleurs popover/texte, liees aux cartes opaques en clair/sombre/systeme. Menus utilisateur/mobile et sous-menus beneficient du meme correctif. Recherche des membres bornee en hauteur et deroulante.
- Inventaire des dialogues, infobulles, notifications, dock, voiles et barres fixes dans `docs/OVERLAY-AUDIT.md`. Transparences intentionnelles preservees.
- Banc local avec le vrai CSS Tailwind : sept familles verifiees dans Chrome en clair/sombre et mobile 390 px ; aucune surface transparente ni debordement horizontal. Les parcours metier complets restent a verifier apres deploiement.
- Tests du theme et du CSS compile ajoutes : suite de 176 tests reussie puis cas sombre systeme supplementaire valide ; 15 tests PostgreSQL ignores localement. Build Next/TypeScript et lint cible reussis. Aucun deploiement effectue.

## Messagerie persistante - 23 octobre 2026

- Production inspectee en lecture seule : image web encore `constellation-button-2026dd4-20261020t223351z`, anterieure aux corrections fusionnees ; 25 comptes disposent d'une image. Aucune photo remplacee ou inventee.
- Bulles transformees en boutons : fenetre compacte, reduction conservant le brouillon, fermeture explicite et lien vers la page complete. Etat dans le layout racine, conserve pendant la navigation Next ; pas de stockage des messages ou brouillons dans le navigateur.
- Recents tries par date du dernier message, conversations vides exclues, salons communautaires lies a leur URL canonique. Anciennes URL `/messages/community-chat-*` redirigees seulement pour les membres autorises.
- Polling suspendu pour les fenetres reduites, discussion inaccessible retiree, brouillon conserve en cas d'echec reseau a l'envoi, photos affichees aussi dans les messages.
- 173 tests passent, dont les tests DOM du dock et des autorisations/recents ; 15 tests PostgreSQL ignores faute de base isolee. Build Next/TypeScript et lint cible reussis. PR #95 ouverte. Recette navigateur connectee et deploiement encore requis ; aucun deploiement effectue.

## Securite et CI - 23 octobre 2026

- PR #94 : branche actualisee avec `main`, sans rebase force ni contournement des protections.
- Next et ESLint Next 16.4.2 ; Sentry 10.76.2 ; Prisma/Client/adaptateur PostgreSQL 7.10.1 ; Vitest 4.1.12 et Vite 8.3.5 dans le lockfile.
- Audit production : zero vulnerabilite signalee. Audit complet : cinq alertes elevees de la chaine ESLint/fast-glob/micromatch/braces, sans correctif compatible propose ; aucune retrogradation majeure forcee.
- Healthcheck CI explicite : `pg_isready -U afrocodeurs -d afrocodeurs -h 127.0.0.1`. Test de regression ajoute ; audit bloquant et revue obligatoire conserves.
- 165 tests passent ; 15 tests PostgreSQL non executes localement faute de base isolee active. Lint sans erreur (quatre avertissements existants), build Next/TypeScript reussi. CI relancee au push ; aucun deploiement.

## Fiabilisation Constellation - 22 octobre 2026

- PR #91 fusionnee ; son deploiement durable reste a verifier. Aucun deploiement effectue dans ce lot.
- PR avatars : le dock utilise maintenant une vraie image de taille fixe, avec initiales contrastees si absente ou inaccessible. Le compteur sort du cercle sans etre rogne.
- Formulaire de fiche et messages de collaboration conserves apres une erreur serveur ; double envoi bloque apres succes. Le test DOM a reproduit puis valide la correction des selections remises a zero.
- Partage public affiche uniquement pour les fiches publiees, sans modifier les droits de moderation.
- Port interne Docker change de 4190 (bloque par Fetch) a 3000. Adaptation du compose externe de production indispensable : procedure et retour arriere dans `docs/CONSTELLATION-DEPLOY-FIXES.md`.
- 138 tests passes (suite de 137 puis test du dock), lint cible et build de production Next/TypeScript reussis. Neuf tests PostgreSQL non executes : cluster temporaire local incomplet (`pg_notify` absent). Recette navigateur et production encore requises.
## Correction CI mentorat - 22 octobre 2026

- PR #88 : deux accolades perdues lors de l'integration Constellation restaurees dans `resolveReportTarget` et `hideTarget`. Retour explicite apres annulation d'une demande de mentorat.
- Lint complet : aucune erreur, quatre avertissements preexistants conserves. Trois tests de regression couvrent la resolution d'une demande, son annulation et la suspension independante d'une fiche Constellation.
- 152 tests passent, 15 tests PostgreSQL non executes faute de base isolee active. Build de production et TypeScript reussis ; aucun deploiement.

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
- PR #87 fusionnee puis deployee le 19 octobre. Google/GitHub ne sont pas configures : boutons masques, recette reelle encore necessaire ; ne pas clore #27 avant ces validations.

## Lot mentorat #26 - 19 octobre 2026

- Annuaire, offres avec sujets/langues/disponibilites/capacite et espace prive de demandes/suivis.
- Acceptation/refus, annulation/fin, pause, blocage propre au mentorat et signalements a la moderation. Motivations non publiques ; aucune coordonnee privee affichee.
- Capacite et decisions protegees par transactions Serializable. Notifications internes atomiques, push apres commit et preferences Social respectees.
- Migration additive testee sur un PostgreSQL temporaire distinct ; 134 tests passent avec six integrations reelles, dont doubles demandes et acceptations concurrentes. Recette navigateur mobile avec comptes fictifs reussie.
- Aucun deploiement ni migration de production. Procedure et limites dans `docs/MENTORSHIP.md`. Web Push reel et grand ecran encore a verifier ; ecart historique BrandSettings.updatedAt laisse intact.

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

**Faire revoir la PR #99 de fiabilite formulaires et auto-validation Constellation avant fusion et deploiement.**

## ⚠️ Risques

- Sans domaine Resend vérifié, les emails transactionnels ne sont pas livrables à tous : inscription, vérification et récupération de compte sont dégradées.
- Les mentions légales restent incomplètes tant que l'identité de l'éditeur et du directeur de publication n'est pas fournie.
- Le stockage média local est éphémère sur Railway sans S3 ; Web Push, Sentry et OAuth sont inactifs faute de configuration.

## 🚦 Verdict de lancement

**GO pour une bêta contrôlée. NO-GO pour un lancement public large** tant que l'email transactionnel et les mentions légales ne sont pas finalisés.

## 🧱 Stack & structure

Next.js 16.2.7 (App Router) + React 19, Auth.js v5, Prisma 7/PostgreSQL, Vitest, Railway et GitHub Actions. Architecture modulaire `features/<domaine>/`, Server Actions protégées par les gardes centralisées de `lib/guard.ts`.

ALTER TABLE "PlatformUpdate" ADD COLUMN "requestedBy" TEXT;
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'MESSAGE';
ALTER TABLE "PlatformUpdate" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "ProductFeedback" ADD COLUMN "submittedByLabel" TEXT;
ALTER TABLE "Knowledge" ADD COLUMN "communityId" TEXT;
ALTER TABLE "Problem" ADD COLUMN "communityId" TEXT;
ALTER TABLE "Question" ADD COLUMN "communityId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "communityId" TEXT;
ALTER TABLE "CommunityMember" ADD COLUMN "chatLastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CommunityMember" ADD COLUMN "chatMutedUntil" TIMESTAMP(3);
CREATE INDEX "Knowledge_communityId_idx" ON "Knowledge"("communityId");
CREATE INDEX "Problem_communityId_idx" ON "Problem"("communityId");
CREATE INDEX "Question_communityId_idx" ON "Question"("communityId");
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Conversation_communityId_key" ON "Conversation"("communityId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Conversation" ("id", "type", "title", "communityId", "createdAt", "updatedAt")
SELECT 'community-chat-' || "id", 'GROUP', 'Salon · ' || "name", "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Community"
ON CONFLICT ("communityId") DO NOTHING;

-- Les ressources déjà publiées avant l'automatisation ont été vérifiées manuellement.
UPDATE "Knowledge"
SET "lastVerifiedAt" = COALESCE("publishedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'PUBLISHED' AND "lastVerifiedAt" IS NULL;

UPDATE "PlatformUpdate"
SET "requestedBy" = 'Codeur Nwar, @Obed et la communauté'
WHERE "id" = 'afrocodeurs-2026-08-community';

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-messaging', 'Août 2026', 'Messagerie privée, groupes et chat général', 'Les membres peuvent maintenant démarrer des conversations, créer des groupes et retrouver leurs échanges depuis la bulle de chat.', E'## Livré grâce à vos retours\n\n- conversations privées entre membres ;\n- groupes de discussion ;\n- chat général ;\n- recherche de membres avec autocomplétion ;\n- indicateurs de nouveaux messages.\n\nLes salons propres aux communautés, le partage de fichiers et les cours en direct restent dans les demandes à étudier.', 'DEMANDE COMMUNAUTAIRE', 'Codeur Nwar et @Obed', '/forum/penssees-a-integrer-un-des-messageries-pour-nous-permettre-d-interagir-entre-nous-et-bien-d-autre', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('community-request-resources', 'Août 2026', 'Partager une ressource est désormais accessible et fiable', 'Le Knowledge Hub affiche un bouton clair pour proposer une ressource et le parcours de soumission a été fiabilisé.', E'## Ce qui a changé\n\n- bouton **Partager une ressource** visible dans le Knowledge Hub ;\n- formulaire disponible aux membres connectés ;\n- brouillon et soumission à validation ;\n- messages d’erreur plus utiles ;\n- conservation des informations saisies en cas d’échec.', 'CORRECTION', 'Codeur Nwar et olalbns', '/explorer/il-est-jusqu-a-present-impossible-de-partager-une-ressources', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('community-request-markdown', 'Août 2026', 'Articles Markdown et images correctement affichés', 'Les titres, listes, liens, blocs de code, tableaux et images des articles disposent maintenant d’un rendu éditorial complet.', E'## Ce qui a changé\n\n- correction des articles enveloppés dans un bloc Markdown global ;\n- styles complets pour les titres, listes, citations, tableaux et code ;\n- images responsives ;\n- état explicite lorsqu’un fichier image est absent.', 'CORRECTION', 'Oumarou Sanda Souley', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-community-chat-links', 'Août 2026', 'Salons et liens propres à chaque communauté', 'Chaque communauté dispose d’un salon réservé à ses membres et peut partager des liens visibles localement comme dans le Knowledge Hub.', E'## Ce qui a changé\n\n- salon automatique par communauté ;\n- historique visible aux nouveaux membres ;\n- accès retiré lorsque le membre quitte la communauté ;\n- messages non lus intégrés à la messagerie ;\n- suppression par l’auteur ou un administrateur ;\n- rôles membre, modérateur et administrateur ;\n- exclusion d’un membre avec protection du dernier administrateur ;\n- suspension temporaire du droit d’écrire ;\n- signalement d’un message précis ;\n- recherche dans les échanges et chargement progressif de l’historique ;\n- historique des actions de modération ;\n- partage de liens depuis la communauté ;\n- visibilité maintenue dans le Knowledge Hub général.', 'AMÉLIORATION', 'Codeur Nwar', '/forum/penssees-a-integrer-un-des-messageries-pour-nous-permettre-d-interagir-entre-nous-et-bien-d-autre', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-community-management', 'Août 2026', 'Des communautés administrables et réellement vivantes', 'Les administrateurs peuvent modifier ou supprimer leur communauté et publier des ressources, problèmes ou discussions depuis son espace.', E'## Ce qui a changé\n\n- bouton de gestion réservé aux administrateurs ;\n- modification de la présentation et de la localisation ;\n- suppression avec confirmation et historique ;\n- protection contre le départ du dernier administrateur ;\n- publication depuis la communauté ;\n- fil local des ressources, problèmes et discussions ;\n- contenu toujours visible dans les espaces généraux ;\n- badge cliquable de provenance.', 'AMÉLIORATION', 'Codeur Nwar et Mahamane Korobara', '/explorer/probleme-lies-a-la-communaute', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-moderation-badges', 'Août 2026', 'Publication automatique après 24 h avec badges de confiance', 'Une ressource non traitée dans les 24 h devient publique avec un badge Non vérifié ; une validation humaine lui attribue le badge Vérifié par AfroCodeurs.', E'## Ce qui a changé\n\n- délai de modération de 24 heures ;\n- publication automatique après expiration ;\n- badge **Non vérifié** clairement visible ;\n- badge **Vérifié par AfroCodeurs** après contrôle humain ;\n- notification envoyée à l’auteur ;\n- signalement communautaire toujours disponible.', 'AMÉLIORATION', 'Steve Aster Afovo', '/forum/moderation-des-ressources-pourquoi-ne-pas-privilegier-la-publication-automatique-avec-badges', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-notification-read', 'Août 2026', 'Les notifications se marquent comme lues naturellement', 'Ouvrir une notification suffit désormais à la marquer comme lue et à actualiser immédiatement le compteur.', E'## Ce qui a changé\n\n- lecture individuelle à l’ouverture ;\n- compteur actualisé sans attendre ;\n- fonctionnement identique depuis la cloche et la page complète ;\n- bouton **Tout marquer lu** conservé pour les traitements en masse.', 'AMÉLIORATION', '@Obed', '/forum/afrocodeurs', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-mobile-display', 'Août 2026', 'Un affichage mobile sans chevauchement ni débordement', 'La messagerie, les alertes et les textes longs respectent maintenant l’espace de navigation sur les petits écrans.', E'## Ce qui a changé\n\n- messagerie placée au-dessus de la barre mobile ;\n- bulles secondaires masquées sur les très petits écrans ;\n- panneau de chat limité à la hauteur disponible ;\n- alertes déplacées au-dessus de la navigation ;\n- noms utilisateur tronqués proprement ;\n- protection globale contre le débordement horizontal accidentel.', 'CORRECTION', 'Anwtta et Oumarou Sanda Souley', '/explorer/acces-au-botton-bar', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-navigation', 'Août 2026', 'Une navigation plus claire sur ordinateur et mobile', 'Les rubriques principales restent visibles, les autres sont regroupées dans un menu complet et la déconnexion ne surcharge plus l’en-tête.', E'## Ce qui a changé\n\n- menu principal recentré sur les rubriques essentielles ;\n- menu **Plus** pour accéder aux autres espaces ;\n- menu mobile complet ;\n- déconnexion déplacée dans le profil ;\n- navigation prête à accueillir de futures rubriques sans déborder.', 'AMÉLIORATION', 'Alpha et Mr Darec', '/explorer/experience-utilisateur', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-authenticated-cta', 'Août 2026', 'Un appel à rejoindre AfroCodeurs plus clair et mieux ciblé', 'L’accueil explique désormais précisément l’intérêt de créer un compte et ne montre plus cette invitation aux membres déjà connectés.', E'## Ce qui a changé\n\n- le libellé vague **Rejoindre** devient **Créer mon compte gratuitement** ;\n- une courte phrase explique que le compte sert à publier, échanger et construire avec la communauté ;\n- l’action mène directement à l’inscription ;\n- toute l’invitation disparaît lorsqu’un membre est déjà connecté ;\n- l’en-tête utilise le libellé explicite **Créer un compte**.', 'CORRECTION', 'Oumarou Sanda Souley', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-afromaker-journey', 'Août 2026', 'Le parcours AfroMaker rend la progression compréhensible', 'Chaque membre peut voir son niveau, son prochain objectif et les contributions qui lui permettent de progresser.', E'## Ce qui a changé\n\n- page publique **Le parcours AfroMaker** ;\n- version personnalisée **Mon parcours AfroMaker** après connexion ;\n- niveau actuel et progression vers le prochain palier ;\n- détail participation et contribution ;\n- barème complet des actions récompensées ;\n- raccourcis vers les actions utiles ;\n- explication des points liés aux votes.', 'AMÉLIORATION', 'Mahamane Korobara', '/forum/ma-question-n-a-rien-a-voir-avec-le-code-ou-autres-mais-sur-la-platforms', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ProductFeedback" ("id", "title", "description", "category", "status", "priorityScore", "analysis", "sourceUrl", "authorId", "submittedByLabel", "createdAt", "updatedAt") VALUES
('inventory-community-collaboration', 'Ajouter fichiers et cours en direct aux communautés', 'Périmètre validé pour une prochaine session : fichiers PDF, Markdown, texte et images uniquement, 10 Mo maximum, sans archive ni exécutable ; événements avec lien Jitsi ou BigBlueButton externe ; salons propres aux projets à étudier séparément.', 'MISSING_FEATURE', 'ACCEPTED', 4, 'Périmètre accepté et conservé dans la liste des travaux à planifier. Le salon communautaire et les liens sont déjà livrés.', '/forum/penssees-a-integrer-un-des-messageries-pour-nous-permettre-d-interagir-entre-nous-et-bien-d-autre', (SELECT "id" FROM "User" WHERE "username" = 'codeur_nwar' LIMIT 1), 'Codeur Nwar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('inventory-engagement-events', 'Rendre la plateforme plus interactive et engageante', 'Étudier les lives, ateliers, mentorat, calendrier, rappels, inscriptions, missions accomplies, nouveaux membres et progrès communautaires.', 'MISSING_FEATURE', 'NEW', 4, 'Retour public importé pour étude, sans décision prise.', '/explorer/comment-rendre-afrocodeurs-plus-interactive-et-engageante', (SELECT "id" FROM "User" WHERE "username" = 'codescooper' LIMIT 1), 'CodeScooper', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('inventory-reputation-guide', 'Expliquer clairement le système de réputation', 'Le membre doit comprendre quelles actions donnent des points et comment progresser.', 'UX', 'RESOLVED', 2, 'Livré avec le parcours AfroMaker public et sa progression personnelle pour les membres connectés.', '/forum/ma-question-n-a-rien-a-voir-avec-le-code-ou-autres-mais-sur-la-platforms', NULL, 'Mahamane Korobara', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('inventory-authenticated-cta', 'Masquer le bouton Rejoindre pour les membres connectés', 'La page d’accueil affiche encore un bouton d’inscription qui renvoie vers l’authentification malgré une session active.', 'BUG', 'RESOLVED', 3, 'Corrigé : l’invitation disparaît pour les membres connectés. Pour les visiteurs, elle explique clairement la création du compte et sa valeur.', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', NULL, 'Oumarou Sanda Souley', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('inventory-compensation-data', 'Créer un observatoire anonyme des salaires et tarifs', 'Permettre le partage anonyme des salaires, tarifs, missions, expériences, technologies, pays et types de clients.', 'MISSING_FEATURE', 'NEW', 3, 'Retour public importé pour étude, sans décision prise.', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', (SELECT "id" FROM "User" WHERE "username" = 'dylan' LIMIT 1), 'Dylan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('inventory-congo-community', 'Étudier une communauté Congo-Brazzaville', 'Un membre souhaite pouvoir rejoindre ou créer une communauté géographique pour le Congo-Brazzaville.', 'CONTENT', 'NEW', 2, 'Retour public importé pour étude, sans décision prise.', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', NULL, 'elenga', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

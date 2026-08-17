ALTER TABLE "Community" ADD COLUMN "geoKey" TEXT;
CREATE UNIQUE INDEX "Community_geoKey_key" ON "Community"("geoKey");

DO $$
DECLARE founder_id TEXT;
BEGIN
  SELECT "id" INTO founder_id FROM "User" WHERE "username" IN ('elenga', 'codescooper') ORDER BY CASE WHEN "username"='elenga' THEN 0 ELSE 1 END LIMIT 1;
  IF founder_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Community" WHERE "geoKey"='cg:national') THEN
    INSERT INTO "Community" ("id","name","slug","description","type","country","city","geoKey","createdAt","updatedAt") VALUES ('official-congo-brazzaville','AfroCodeurs Congo-Brazzaville','afrocodeurs-congo-brazzaville','La communauté nationale des développeurs, makers et passionnés de technologie de la République du Congo.','GEO','République du Congo',NULL,'cg:national',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    INSERT INTO "CommunityMember" ("id","userId","communityId","role","joinedAt","chatLastReadAt") VALUES ('founder-congo-brazzaville',founder_id,'official-congo-brazzaville','ADMIN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    INSERT INTO "Conversation" ("id","type","title","communityId","createdAt","updatedAt") VALUES ('chat-congo-brazzaville','GROUP','Salon · AfroCodeurs Congo-Brazzaville','official-congo-brazzaville',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
  END IF;
END $$;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-official-geo-spaces', 'Août 2026', 'Des communautés géographiques officielles sans doublons', 'Un pays ou une ville possède désormais un seul espace géographique officiel, administrable à plusieurs, tandis que les communautés thématiques restent libres.', E'## Ce qui a changé\n\n- unicité des communautés géographiques par pays ou ville ;\n- détection des variantes Congo, Congo-Brazzaville et République du Congo ;\n- invitation à rejoindre l’espace existant plutôt que le dupliquer ;\n- communautés thématiques toujours libres ;\n- création de **AfroCodeurs Congo-Brazzaville** ;\n- elenga désigné comme fondateur lorsque son compte est disponible.', 'AMÉLIORATION', 'elenga', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('community-request-world-ranking', 'Août 2026', 'L’Afrique au premier plan, la diaspora visible', 'La carte africaine reste le cœur visuel de l’accueil et un classement discret montre les pays où vivent les membres AfroCodeurs.', E'## Ce qui a changé\n\n- carte de l’Afrique conservée au premier plan ;\n- classement mondial par nombre de membres ;\n- diaspora visible sans ajouter de suivi GPS mondial ;\n- données fondées sur le pays renseigné volontairement dans le profil ;\n- aucun pays affiché lorsque l’information est absente.', 'AMÉLIORATION', 'CodeScooper', '/updates#roadmap', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "ProductFeedback" SET "status"='RESOLVED', "analysis"='Communauté nationale créée et système d’unicité géographique ajouté, avec gouvernance multi-administrateurs déjà disponible.' WHERE "id"='inventory-congo-community';

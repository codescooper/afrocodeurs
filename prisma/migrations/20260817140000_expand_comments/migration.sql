ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'EVENT';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'OPPORTUNITY';

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('platform-comments-everywhere', 'Août 2026', 'Les discussions accompagnent désormais les contenus', 'Les membres peuvent commenter les ressources, problèmes, projets, événements et opportunités, pas seulement les sujets du forum.', E'## Ce qui a changé\n\n- commentaires sur les ressources et articles ;\n- commentaires sur les problèmes et projets ;\n- commentaires sur les événements et opportunités ;\n- notification de l’auteur ;\n- édition, suppression et historique ;\n- signalement d’un commentaire.', 'AMÉLIORATION', 'La communauté AfroCodeurs', '/updates#roadmap', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

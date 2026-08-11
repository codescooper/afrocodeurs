CREATE TABLE "PlatformUpdate" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'NOUVEAUTÉ',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformUpdate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PlatformUpdateRead" (
  "id" TEXT NOT NULL,
  "updateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformUpdateRead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformUpdate_published_publishedAt_idx" ON "PlatformUpdate"("published", "publishedAt");
CREATE UNIQUE INDEX "PlatformUpdateRead_updateId_userId_key" ON "PlatformUpdateRead"("updateId", "userId");
CREATE INDEX "PlatformUpdateRead_userId_readAt_idx" ON "PlatformUpdateRead"("userId", "readAt");
ALTER TABLE "PlatformUpdateRead" ADD CONSTRAINT "PlatformUpdateRead_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "PlatformUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformUpdateRead" ADD CONSTRAINT "PlatformUpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "published", "publishedAt", "updatedAt") VALUES (
  'afrocodeurs-2026-08-community',
  'Août 2026',
  'AfroCodeurs devient plus communautaire',
  'Ressources, défis interactifs, messagerie et amélioration de l’inscription sont maintenant réunis dans une même évolution.',
  E'## Ce qui est nouveau\n\n- **Ressources communautaires** : partagez des cours, astuces, outils, vidéos et liens.\n- **AfroCodeurs Défis** : résolvez des énigmes hebdomadaires et gagnez des points.\n- **CTF pixel art** : explorez des scènes, manipulez des objets et utilisez un terminal simulé.\n- **Messagerie** : échangez en privé ou créez des groupes de travail.\n- **Inscription plus fluide** : les noms d’utilisateur sont automatiquement normalisés en minuscules.\n\nCes fonctionnalités évolueront avec les retours et les idées de la communauté.',
  'VERSION MAJEURE',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

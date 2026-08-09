-- Nettoyage des images en Base64 stockées dans la colonne User.image
UPDATE "User"
SET "image" = NULL
WHERE "image" LIKE 'data:image%';

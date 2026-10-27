ALTER TABLE "CommunityVenture" ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '', ADD COLUMN "pendingChanges" JSONB;
ALTER TABLE "VentureCollaboration" ADD COLUMN "history" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

-- Backfill existing public records without changing their publication state.
UPDATE "CommunityVenture" SET "searchText" =
  trim(regexp_replace(replace(replace(replace(replace(lower(regexp_replace(
    normalize(concat_ws(' ', "name", "summary", "description", array_to_string("needs", ' ')), NFD),
    U&'[\0300-\036f]', '', 'g')), 'œ', 'oe'), 'æ', 'ae'), 'Œ', 'oe'), 'Æ', 'ae'), '\s+', ' ', 'g'));

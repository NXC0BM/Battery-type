BEGIN;
-- Backfill known catalogue models without translating or inventing electrical ratings.
UPDATE battery_type SET short_description_en = CASE
  WHEN model_name ILIKE '%HG2%' THEN 'Green cylindrical LG HG2 lithium ion battery cell for portable power tools.'
  WHEN model_name ILIKE '%25R%' THEN 'Green cylindrical Samsung 25R lithium ion battery cell for portable power tools.'
END
WHERE (short_description_en IS NULL OR length(short_description_en) < 50)
  AND (model_name ILIKE '%HG2%' OR model_name ILIKE '%25R%');
-- Drafts can be incomplete. Publishing requires the English caption used by CLIP.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='battery_type_published_caption_check') THEN
    ALTER TABLE battery_type ADD CONSTRAINT battery_type_published_caption_check
      CHECK (status <> 'published' OR
        (short_description_en IS NOT NULL AND length(short_description_en) BETWEEN 50 AND 100
         AND short_description_en ~ '^[ -~]+$')) NOT VALID;
  END IF;
END $$;
COMMIT;

BEGIN;
ALTER TABLE battery_type ADD COLUMN IF NOT EXISTS model_url VARCHAR(255);
ALTER TABLE battery_type ADD COLUMN IF NOT EXISTS short_description_en VARCHAR(100);
ALTER TABLE battery_type ADD COLUMN IF NOT EXISTS rotation_x DOUBLE PRECISION NOT NULL DEFAULT random()*2*pi();
ALTER TABLE battery_type ADD COLUMN IF NOT EXISTS rotation_y DOUBLE PRECISION NOT NULL DEFAULT random()*2*pi();
CREATE INDEX IF NOT EXISTS battery_type_published_id_idx ON battery_type(id) WHERE status='published';
-- Same guarded numeric expression as the capacity filter; malformed EAV values stay NULL.
CREATE INDEX IF NOT EXISTS battery_type_capacity_value_idx ON battery_type_attributes
 (attribute_id, (CASE WHEN value ~ '^[0-9]+([.][0-9]+)?$' THEN value::numeric END), battery_type_id);
COMMIT;

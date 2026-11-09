-- Выполнять на резервной копии. Вся миграция атомарна; повторный запуск безопасен.
BEGIN;
ALTER TABLE attributes ADD COLUMN IF NOT EXISTS code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attribute_code ON attributes(code);
INSERT INTO attributes (code, name, unit) VALUES
 ('capacity_mah', 'Ёмкость', 'мА·ч'), ('nominal_voltage_v', 'Напряжение', 'В')
ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code, unit = EXCLUDED.unit;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema()
   AND table_name = 'battery_type' AND column_name = 'capacity_mah') THEN
  INSERT INTO battery_type_attributes(battery_type_id, attribute_id, value)
  SELECT b.id, a.id, b.capacity_mah::text FROM battery_type b CROSS JOIN attributes a
  WHERE a.code = 'capacity_mah' AND b.capacity_mah IS NOT NULL
  ON CONFLICT (battery_type_id, attribute_id) DO UPDATE SET value = EXCLUDED.value;
  INSERT INTO battery_type_attributes(battery_type_id, attribute_id, value)
  SELECT b.id, a.id, b.nominal_voltage_v::text FROM battery_type b CROSS JOIN attributes a
  WHERE a.code = 'nominal_voltage_v' AND b.nominal_voltage_v IS NOT NULL
  ON CONFLICT (battery_type_id, attribute_id) DO UPDATE SET value = EXCLUDED.value;
 END IF;
END $$;
-- Запрещаем каскадное удаление, включая FK из прежней версии миграции 002.
DO $$ DECLARE fk RECORD;
BEGIN
 FOR fk IN SELECT conname FROM pg_constraint
   WHERE conrelid = 'battery_type_attributes'::regclass AND contype = 'f' AND confrelid = 'battery_type'::regclass
 LOOP EXECUTE format('ALTER TABLE battery_type_attributes DROP CONSTRAINT %I', fk.conname); END LOOP;
END $$;
ALTER TABLE battery_type_attributes ADD CONSTRAINT fk_battery_type_value
 FOREIGN KEY (battery_type_id) REFERENCES battery_type(id) ON DELETE RESTRICT;
ALTER TABLE battery_type DROP COLUMN IF EXISTS capacity_mah;
ALTER TABLE battery_type DROP COLUMN IF EXISTS nominal_voltage_v;
-- При дубликатах миграция откатится, а не удалит пользовательские данные.
CREATE UNIQUE INDEX IF NOT EXISTS uq_like_user_battery_type ON likes(user_id, battery_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_battery_type_draft ON battery_type(creator_id) WHERE status = 'draft';
COMMIT;

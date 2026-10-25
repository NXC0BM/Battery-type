-- EAV: таблица атрибутов + вертикальная таблица значений (М-М battery_type <-> attributes).
-- Доп. характеристики услуги хранятся строками, а не колонками: набор можно
-- расширять/сокращать без изменения структуры БД.

CREATE TABLE IF NOT EXISTS attributes (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  unit VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS battery_type_attributes (
  id              SERIAL PRIMARY KEY,
  battery_type_id INTEGER NOT NULL REFERENCES battery_type(id) ON DELETE CASCADE,
  attribute_id    INTEGER NOT NULL REFERENCES attributes(id) ON DELETE RESTRICT,
  value           VARCHAR(255) NOT NULL,
  CONSTRAINT uq_battery_type_attribute UNIQUE (battery_type_id, attribute_id)
);

-- Справочник атрибутов
INSERT INTO attributes (name, unit) VALUES
  ('Химия', NULL),
  ('Макс. ток разряда', 'А'),
  ('Масса', 'г'),
  ('Типоразмер', NULL),
  ('Ресурс', 'циклов')
ON CONFLICT (name) DO NOTHING;

-- Демо-значения для первой опубликованной карточки (для скриншотов)
INSERT INTO battery_type_attributes (battery_type_id, attribute_id, value)
SELECT b.id, a.id, v.value
FROM (SELECT id FROM battery_type WHERE status = 'published' ORDER BY id LIMIT 1) b
CROSS JOIN (VALUES
  ('Химия', 'Li-ion'),
  ('Макс. ток разряда', '10'),
  ('Масса', '47'),
  ('Типоразмер', '18650'),
  ('Ресурс', '500')
) AS v(name, value)
JOIN attributes a ON a.name = v.name
ON CONFLICT (battery_type_id, attribute_id) DO NOTHING;

-- Проверка:
-- SELECT b.model_name, a.name, bta.value, a.unit
-- FROM battery_type_attributes bta
-- JOIN attributes a ON a.id = bta.attribute_id
-- JOIN battery_type b ON b.id = bta.battery_type_id;

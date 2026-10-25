-- Rename accumulators -> battery_type (table) and the FK column in likes.
-- Run this against the project's Postgres database AFTER pulling the renamed code,
-- since TypeORM synchronize is disabled (synchronize: false in app.module.ts).

ALTER TABLE accumulators RENAME TO battery_type;
ALTER TABLE likes RENAME COLUMN accumulator_id TO battery_type_id;

-- Sanity check:
-- \d battery_type
-- \d likes

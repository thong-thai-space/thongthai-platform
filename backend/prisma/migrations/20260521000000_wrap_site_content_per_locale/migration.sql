-- Data-only migration: wrap existing SiteContent.data into per-locale shape.
--
-- Before:  data = { ...payload... }
-- After:   data = { "en": { ...payload... }, "vi": null }
--
-- The `WHERE` clause makes the migration idempotent — re-running is a no-op
-- once every row already has the per-locale envelope.

UPDATE "site_contents"
SET "data" = jsonb_build_object('en', "data", 'vi', NULL::jsonb)
WHERE NOT ("data" ? 'vi' OR "data" ? 'en');

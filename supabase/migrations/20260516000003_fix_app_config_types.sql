-- =====================================================
-- Fix legacy app_config values stored as JSON-quoted strings.
--
-- Previously AdminConfigService.updateConfig() used `String(value)`
-- before upsert, coercing booleans → "true"/"false" strings and
-- numbers → "0"/"0.15" strings inside the jsonb column.
--
-- AdminConfigService.getConfig() then mis-parsed `"0"` back to the
-- literal string `'0'` (Number('0') || '0' bug), which broke the
-- z.number() validator on the next save.
--
-- Code is now fixed to pass typed values directly + parse defensively.
-- This migration cleans up existing rows so future reads return
-- correctly-typed values without relying on the defensive parser.
-- =====================================================

update public.app_config
set value = '0'::jsonb
where jsonb_typeof(value) = 'string' and value #>> '{}' = '0';

update public.app_config
set value = 'true'::jsonb
where jsonb_typeof(value) = 'string' and value #>> '{}' = 'true';

update public.app_config
set value = 'false'::jsonb
where jsonb_typeof(value) = 'string' and value #>> '{}' = 'false';

-- Numeric values (e.g. '0.15', '24') stored as strings → cast to number
update public.app_config
set value = ((value #>> '{}')::numeric)::text::jsonb
where jsonb_typeof(value) = 'string'
  and value #>> '{}' ~ '^-?\d+(\.\d+)?$';

ALTER TABLE public.integrations_settings ADD COLUMN IF NOT EXISTS field_mappings jsonb DEFAULT '{}'::jsonb;

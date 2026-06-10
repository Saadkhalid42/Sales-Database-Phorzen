CREATE TABLE IF NOT EXISTS public.integrations_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_access_token text,
  meta_verify_token text,
  form_mappings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one row exists for settings
CREATE UNIQUE INDEX idx_single_integration_settings ON public.integrations_settings ((1));

-- Set up Row Level Security (RLS)
ALTER TABLE public.integrations_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow authenticated read access"
  ON public.integrations_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow write access to authenticated users (admins can configure this later via the app)
CREATE POLICY "Allow authenticated insert access"
  ON public.integrations_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access"
  ON public.integrations_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create a function to insert default row if it doesn't exist
CREATE OR REPLACE FUNCTION initialize_integrations_settings()
RETURNS void AS $$
BEGIN
  INSERT INTO public.integrations_settings (id)
  VALUES (gen_random_uuid())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run the initialization
SELECT initialize_integrations_settings();

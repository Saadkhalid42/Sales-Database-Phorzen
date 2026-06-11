CREATE TABLE IF NOT EXISTS meta_raw_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    leadgen_id TEXT NOT NULL,
    form_id TEXT,
    raw_data JSONB NOT NULL
);
ALTER TABLE meta_raw_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON meta_raw_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION admin_add_tabs_history_to_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic sanity check to prevent SQL injection.
  -- Validates that the table name only contains alphanumeric characters and underscores.
  IF table_name ~ '^[a-zA-Z0-9_]+$' THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tabs_history JSONB DEFAULT ''[]''::jsonb', table_name);
  ELSE
    RAISE EXCEPTION 'Invalid table name';
  END IF;
END;
$$;

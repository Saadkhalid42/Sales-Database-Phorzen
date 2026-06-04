CREATE OR REPLACE FUNCTION admin_create_append_only_column(table_name text, column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic sanity check to prevent SQL injection.
  -- Validates that the table and column names only contain alphanumeric characters and underscores.
  IF table_name ~ '^[a-zA-Z0-9_]+$' AND column_name ~ '^[a-zA-Z0-9_]+$' THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I JSONB DEFAULT ''[]''::jsonb', table_name, column_name);
  ELSE
    RAISE EXCEPTION 'Invalid table or column name';
  END IF;
END;
$$;

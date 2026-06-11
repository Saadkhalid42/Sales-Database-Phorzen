import { createClient } from '@supabase/supabase-js';

const url = 'https://rmfwgevwqavlqniiomth.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZndnZXZ3cWF2bHFuaWlvbXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTgxMCwiZXhwIjoyMDk1MDQ3ODEwfQ.CsnaBkmEmwD2mNLDZKfnkhvtp0JzmJzmAeRgQKmco7U';

const supabase = createClient(url, serviceKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('app_state')
    .select('state_data')
    .eq('id', 'main_state')
    .single();

  const databases = data.state_data;
  if (databases && databases.length > 0) {
    console.log('Columns for DB:', databases[0].name);
    console.log(databases[0].columns.map(c => ({ label: c.label, key: c.key })));
  }
}

checkColumns();

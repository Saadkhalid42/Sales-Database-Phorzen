import { createClient } from '@supabase/supabase-js';

const url = 'https://rmfwgevwqavlqniiomth.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZndnZXZ3cWF2bHFuaWlvbXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTgxMCwiZXhwIjoyMDk1MDQ3ODEwfQ.CsnaBkmEmwD2mNLDZKfnkhvtp0JzmJzmAeRgQKmco7U';

const supabase = createClient(url, serviceKey);

async function checkLeads() {
  const { data, error } = await supabase
    .from('app_state')
    .select('state_data')
    .eq('id', 'main_state')
    .single();

  if (error) {
    console.error('Error fetching state:', error);
    return;
  }

  const databases = data.state_data;
  if (!databases) {
    console.log('No state data found.');
    return;
  }

  let foundLeads = 0;
  for (const db of databases) {
    for (const record of db.records) {
      if (record.cells && record.cells._source === 'Meta Lead Form') {
        console.log('FOUND LEAD in DB:', db.name);
        console.log(JSON.stringify(record.cells, null, 2));
        foundLeads++;
      }
    }
  }

  if (foundLeads === 0) {
    console.log('No test leads found in the database yet.');
  } else {
    console.log(`Found ${foundLeads} lead(s)!`);
  }
}

checkLeads();

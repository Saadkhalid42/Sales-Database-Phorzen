import { createClient } from '@supabase/supabase-js';

const url = 'https://rmfwgevwqavlqniiomth.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZndnZXZ3cWF2bHFuaWlvbXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTgxMCwiZXhwIjoyMDk1MDQ3ODEwfQ.CsnaBkmEmwD2mNLDZKfnkhvtp0JzmJzmAeRgQKmco7U';

const supabase = createClient(url, serviceKey);

async function setToken() {
  const { data: selectData, error: selectError } = await supabase.from('integrations_settings').select('id').single();
  
  if (selectError) {
     console.log('Error selecting', selectError);
     // Try to insert
     const { error: insertError } = await supabase.from('integrations_settings').insert({
        meta_verify_token: 'phorzen_meta_leads_9f8d7b6c5a4'
     });
     console.log('Insert error?', insertError);
  } else if (selectData) {
     const { error: updateError } = await supabase.from('integrations_settings').update({
        meta_verify_token: 'phorzen_meta_leads_9f8d7b6c5a4'
     }).eq('id', selectData.id);
     console.log('Update error?', updateError);
  }
  
  console.log('Done!');
}

setToken();

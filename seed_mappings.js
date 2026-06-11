import { createClient } from '@supabase/supabase-js';

const url = 'https://rmfwgevwqavlqniiomth.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZndnZXZ3cWF2bHFuaWlvbXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTgxMCwiZXhwIjoyMDk1MDQ3ODEwfQ.CsnaBkmEmwD2mNLDZKfnkhvtp0JzmJzmAeRgQKmco7U';

const supabase = createClient(url, serviceKey);

async function seedMappings() {
  const { data, error } = await supabase.from('integrations_settings').select('id').single();
  
  if (data) {
     const fieldMappings = {
        "full_name": "lead_name_xeup",
        "email": "lead_email_ng2a",
        "phone_number": "lead_number_08aw"
     };
     
     const { error: updateError } = await supabase.from('integrations_settings').update({
        field_mappings: fieldMappings
     }).eq('id', data.id);
     
     console.log('Update error?', updateError);
  }
}

seedMappings();

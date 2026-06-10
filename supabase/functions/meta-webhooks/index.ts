import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Helper to handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch settings from our new table
    const { data: settingsData, error: settingsError } = await supabase
      .from('integrations_settings')
      .select('meta_access_token, meta_verify_token, form_mappings, field_mappings')
      .single();

    if (settingsError || !settingsData) {
      console.error('Failed to fetch integration settings:', settingsError);
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    const { meta_access_token, meta_verify_token, form_mappings, field_mappings } = settingsData;

    // 2. Handle Meta Webhook Verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === meta_verify_token) {
        console.log('Webhook verified successfully.');
        return new Response(challenge, { status: 200, headers: corsHeaders });
      } else {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }
    }

    // 3. Handle Incoming Lead Data (POST request)
    if (req.method === 'POST') {
      const payload = await req.json();

      if (payload.object === 'page') {
        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;

              // Fetch lead data from Meta Graph API
              if (!meta_access_token) {
                console.error('Missing Meta Access Token');
                continue;
              }

              const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${meta_access_token}`;
              const graphResponse = await fetch(graphUrl);
              const leadData = await graphResponse.json();

              if (leadData.error) {
                console.error('Error fetching lead data:', leadData.error);
                continue;
              }

              // Transform the field_data array into a simple key-value object
              const transformedData: Record<string, any> = {};
              leadData.field_data.forEach((field: any) => {
                // Check if there's a mapped key for this Meta field
                const mappedKey = field_mappings?.[field.name];
                const finalKey = mappedKey || field.name;
                transformedData[finalKey] = field.values[0];
              });
              
              // Add meta metadata
              transformedData['_source'] = 'Meta Lead Form';
              transformedData['_form_id'] = formId;
              transformedData['_leadgen_id'] = leadgenId;
              transformedData['_created_time'] = leadData.created_time;

              // Determine target database based on form_mappings
              // For simplicity, we fallback to inserting into a "Meta Leads" grid if no mapping exists,
              // or just appending to the primary database.
              // Note: Because the entire grid is in `app_state`, updating from the backend requires:
              // 1. Fetching `app_state` where id = 'main_state'
              // 2. Finding the mapped database (or default)
              // 3. Appending the record
              // 4. Saving `app_state`
              
              let targetDbId = form_mappings?.[formId]?.databaseId || null;
              
              // Fetch app_state
              const { data: stateData, error: stateError } = await supabase
                .from('app_state')
                .select('state_data')
                .eq('id', 'main_state')
                .single();
                
              if (stateError || !stateData) {
                  console.error('Error fetching app_state:', stateError);
                  continue;
              }
              
              const databases = stateData.state_data;
              
              let targetDb = databases.find((db: any) => db.id === targetDbId);
              if (!targetDb) {
                  // Fallback to the first database if no mapping matches
                  targetDb = databases[0];
              }
              
              if (targetDb) {
                  const newRecord = {
                      id: `rec_${Math.random().toString(36).substr(2, 9)}`,
                      cells: transformedData
                  };
                  
                  targetDb.records.push(newRecord);
                  
                  // Save updated state
                  const { error: updateError } = await supabase
                      .from('app_state')
                      .update({ state_data: databases })
                      .eq('id', 'main_state');
                      
                  if (updateError) {
                      console.error('Error updating app_state:', updateError);
                  } else {
                      console.log('Successfully inserted lead into database:', newRecord.id);
                  }
              }

            }
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200, headers: corsHeaders });
      } else {
        return new Response('Not a page object', { status: 404, headers: corsHeaders });
      }
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});

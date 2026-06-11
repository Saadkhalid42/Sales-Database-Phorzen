import webpush from "npm:web-push@3.6.7";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || '';
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.org",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured in environment variables');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { username, old_value, new_value, field_name, first_cell_value, field_id } = payload

    if (!field_id) {
      return new Response(JSON.stringify({ error: 'Missing field_id' }), { status: 400, headers: corsHeaders })
    }

    // Find users tracking this field
    const { data: settings, error: settingsError } = await supabaseClient
      .from('user_notification_settings')
      .select('user_id, notified_field_keys');

    if (settingsError) throw settingsError;

    const userIdsToNotify = settings
      .filter((s: any) => s.notified_field_keys.includes(field_id))
      .map((s: any) => s.user_id);

    if (userIdsToNotify.length === 0) {
       return new Response(JSON.stringify({ message: 'No users to notify' }), { status: 200, headers: corsHeaders })
    }

    // Fetch their subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('user_push_subscriptions')
      .select('user_id, endpoint, auth, p256dh')
      .in('user_id', userIdsToNotify);

    if (subError) throw subError;

    const formatVal = (v: any) => (v === '' || v === null || v === undefined) ? 'empty' : v;
    const title = `${username || 'Someone'} changed the ${field_name || 'field'} from ${formatVal(old_value)} to ${formatVal(new_value)} of ${first_cell_value || 'Record'}`;
    
    const pushPayload = JSON.stringify({
      title: "Field Update",
      body: title,
    });

    const sendPromises = subscriptions.map((sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };
      // We skip sending to the user who made the change
      if (sub.user_id === payload.user_id) return Promise.resolve();

      return webpush.sendNotification(pushSubscription, pushPayload).catch(err => {
        console.error("Push error:", err);
        // If subscription is invalid/expired (HTTP 410 or 404), we could delete it here
      });
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, notified: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

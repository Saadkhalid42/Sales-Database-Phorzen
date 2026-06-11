import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(userId: string) {
  if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    
    const subJson = subscription.toJSON();
    
    if (subJson.endpoint && subJson.keys?.auth && subJson.keys?.p256dh) {
      await supabase.from('user_push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        auth: subJson.keys.auth,
        p256dh: subJson.keys.p256dh
      }, { onConflict: 'endpoint' });
    }
  } catch (err) {
    console.error('Failed to subscribe to push', err);
  }
}

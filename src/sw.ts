/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// This will be replaced by workbox-precaching with the list of files to cache
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    const title = payload.title || 'Notification';
    const options = {
      body: payload.body || '',
      icon: '/vite.svg', // Default icon, can be customized
      data: payload.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // If it's not JSON, just show it as text
    event.waitUntil(
      self.registration.showNotification('New Update', {
        body: event.data.text(),
        icon: '/vite.svg',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Optionally open the app when clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

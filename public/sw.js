self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'PetArk Owners';
  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});
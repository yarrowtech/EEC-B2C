// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || "EEC Notification";
    const options = {
      body: data.body || "",
      icon: data.icon || "/logo_new.png",
      badge: data.badge || "/logo_new.png",
      tag: "eec-notification",
      requireInteraction: false,
      timestamp: data.timestamp || Date.now(),
      vibrate: [200, 100, 200],
      image: data.image || null,
      data: {
        url: data.url || "/",
        notificationId: data.notificationId,
      },
    };

    // Notify all clients that a new notification arrived
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(title, options),
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'NOTIFICATION_RECEIVED',
              notificationId: data.notificationId,
            });
          });
        }),
      ])
    );
  } catch (error) {
    console.error("Push event error:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's an EEC window open (any page)
        const eecClient = clientList.find((client) => {
          const url = new URL(client.url);
          return url.origin === self.location.origin;
        });

        if (eecClient) {
          // If EEC is open, navigate to the notification page and focus
          return eecClient.navigate(urlToOpen).then((client) => client.focus());
        }

        // If no EEC window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});

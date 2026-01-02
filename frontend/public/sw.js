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
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Push event error:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});

// public/firebase-messaging-sw.js
// Set up Service Worker for Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// We listen for a message from the client to initialize with their dynamic environment variables.
// Service Workers in Next.js public folder cannot access process.env directly at runtime.
let messaging = null;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_FIREBASE') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(event.data.config);
                messaging = firebase.messaging();

                // Optional: Customize background notification handling here
                messaging.onBackgroundMessage((payload) => {
                    console.log('[firebase-messaging-sw.js] Received background message ', payload);

                    const notificationTitle = payload.notification.title || "Traffic Surge!";
                    const notificationOptions = {
                        body: payload.notification.body || "Matches are happening instantly right now. Jump in!",
                        icon: '/whobee.png',
                        badge: '/whobee.png',
                        data: payload.data || {}
                    };

                    self.registration.showNotification(notificationTitle, notificationOptions);
                });
            }
        } catch (error) {
            console.error('Error initializing Firebase in Service Worker:', error);
        }
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Determine the URL to open (either standard app or specific room if provided in payload)
    const targetUrl = event.notification.data?.url || '/lobby';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

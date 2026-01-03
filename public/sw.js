/**
 * DailyDash Service Worker
 * Handles push notifications and background events
 */

const CACHE_NAME = 'dailydash-v1';
const APP_ICON = '/app-icon-192.png';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/app-icon-192.png',
                '/app-icon-512.png',
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Push event - handle incoming push notifications (even when browser is closed!)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {
        title: 'DailyDash',
        body: 'You have a new notification',
        icon: APP_ICON,
        tag: 'dailydash-default',
    };

    // Parse push data
    if (event.data) {
        try {
            const payload = event.data.json();
            data = {
                title: payload.title || data.title,
                body: payload.body || data.body,
                icon: payload.icon || APP_ICON,
                tag: payload.tag || data.tag,
                data: payload.data || {},
            };
        } catch (e) {
            // If not JSON, use as text
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: APP_ICON,
        vibrate: [200, 100, 200],
        tag: data.tag,
        requireInteraction: false,
        data: data.data || {},
        actions: [
            { action: 'open', title: 'Open DailyDash' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    // Handle action buttons
    if (event.action === 'dismiss') {
        return;
    }

    const data = event.notification.data || {};
    const urlToOpen = data.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if not
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, options } = event.data;
        self.registration.showNotification(title, {
            body,
            icon: APP_ICON,
            badge: APP_ICON,
            vibrate: [200, 100, 200],
            ...options,
        });
    }
});

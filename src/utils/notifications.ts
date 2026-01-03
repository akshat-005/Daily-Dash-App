/**
 * Notification Utility Service
 * Handles browser notifications for DailyDash
 */

// Default notification icon
const DEFAULT_ICON = '/app-icon-192.png';

// Notification preferences key in localStorage
const NOTIFICATION_PREFS_KEY = 'dailydash_notification_prefs';

export interface NotificationPreferences {
    timerComplete: boolean;
    deadlineReminder: boolean;
    streakReminder: boolean;
    dailySummary: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    timerComplete: true,
    deadlineReminder: true,
    streakReminder: true,
    dailySummary: true,
};

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * Request notification permission from the user
 * Returns true if permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNotificationSupported()) {
        console.warn('Notifications are not supported in this browser');
        return false;
    }

    // Already granted
    if (Notification.permission === 'granted') {
        return true;
    }

    // Already denied - can't request again
    if (Notification.permission === 'denied') {
        console.warn('Notification permission was previously denied');
        return false;
    }

    // Request permission
    try {
        const result = await Notification.requestPermission();
        return result === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param body - Notification body text
 * @param options - Additional notification options
 */
export function showNotification(
    title: string,
    body: string,
    options?: {
        icon?: string;
        tag?: string;
        requireInteraction?: boolean;
        data?: Record<string, unknown>;
        vibrate?: number[];
    }
): Notification | null {
    if (!isNotificationSupported()) {
        console.warn('Notifications are not supported');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: options?.icon || DEFAULT_ICON,
            tag: options?.tag,
            requireInteraction: options?.requireInteraction || false,
            data: options?.data,
        });

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options?.requireInteraction) {
            setTimeout(() => notification.close(), 5000);
        }

        return notification;
    } catch (error) {
        console.error('Error showing notification:', error);
        return null;
    }
}

/**
 * Show notification via Service Worker (for when app is in background)
 */
export async function showServiceWorkerNotification(
    title: string,
    body: string,
    options?: {
        icon?: string;
        tag?: string;
        requireInteraction?: boolean;
        data?: Record<string, unknown>;
    }
): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        // Fallback to regular notification
        return showNotification(title, body, options) !== null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body,
            icon: options?.icon || DEFAULT_ICON,
            tag: options?.tag,
            requireInteraction: options?.requireInteraction || false,
            data: options?.data,
            badge: DEFAULT_ICON,
        });
        return true;
    } catch (error) {
        console.error('Error showing service worker notification:', error);
        // Fallback to regular notification
        return showNotification(title, body, options) !== null;
    }
}

/**
 * Get notification preferences from localStorage
 */
export function getNotificationPreferences(): NotificationPreferences {
    try {
        const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (stored) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Error reading notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences to localStorage
 */
export function setNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
    try {
        const current = getNotificationPreferences();
        const updated = { ...current, ...prefs };
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving notification preferences:', error);
    }
}

/**
 * Check if a specific notification type is enabled
 */
export function isNotificationEnabled(type: keyof NotificationPreferences): boolean {
    const prefs = getNotificationPreferences();
    return prefs[type] && Notification.permission === 'granted';
}

// ============================================
// Web Push Subscription Functions
// ============================================

/**
 * Get the VAPID public key from environment
 * This should be set in your .env file as VITE_VAPID_PUBLIC_KEY
 */
export function getVapidPublicKey(): string | null {
    // @ts-ignore - Vite environment variable
    const key = import.meta.env?.VITE_VAPID_PUBLIC_KEY;
    if (!key) {
        console.warn('VAPID public key not configured. Set VITE_VAPID_PUBLIC_KEY in .env');
    }
    return key || null;
}

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Subscribe to Web Push notifications
 * Returns the subscription details to save to database
 */
export async function subscribeToPush(): Promise<{
    endpoint: string;
    p256dh: string;
    auth: string;
} | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return null;
    }

    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) {
        console.error('Cannot subscribe to push: VAPID key missing');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe to push
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });
        }

        // Extract keys
        const key = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (!key || !auth) {
            console.error('Failed to get push subscription keys');
            return null;
        }

        return {
            endpoint: subscription.endpoint,
            p256dh: arrayBufferToBase64(key),
            auth: arrayBufferToBase64(auth),
        };
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
}

/**
 * Unsubscribe from Web Push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return false;
    }
}

/**
 * Check if user is subscribed to push
 */
export async function isPushSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription !== null;
    } catch (error) {
        console.error('Error checking push subscription:', error);
        return false;
    }
}

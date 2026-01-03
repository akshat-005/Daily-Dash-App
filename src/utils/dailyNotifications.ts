/**
 * Daily Notifications Utility
 * Handles streak reminders and daily summary notifications
 */

import { showServiceWorkerNotification, isNotificationEnabled } from './notifications';
import { formatDate } from './dateUtils';

// Default times for daily notifications (24-hour format)
const STREAK_REMINDER_HOUR = 20; // 8 PM
const DAILY_SUMMARY_HOUR = 21; // 9 PM

// LocalStorage keys
const LAST_STREAK_REMINDER_KEY = 'dailydash_last_streak_reminder';
const LAST_DAILY_SUMMARY_KEY = 'dailydash_last_daily_summary';

// Active timeout IDs
let streakReminderTimeout: ReturnType<typeof setTimeout> | null = null;
let dailySummaryTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Calculate milliseconds until a specific hour today (or tomorrow if past)
 */
function getMsUntilHour(hour: number): number {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, 0, 0, 0);

    // If target time has passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}

/**
 * Check if we've already sent a notification today
 */
function hasNotifiedToday(storageKey: string): boolean {
    try {
        const lastNotified = localStorage.getItem(storageKey);
        if (!lastNotified) return false;

        const today = formatDate(new Date());
        return lastNotified === today;
    } catch {
        return false;
    }
}

/**
 * Mark that we've sent a notification today
 */
function markNotifiedToday(storageKey: string): void {
    try {
        localStorage.setItem(storageKey, formatDate(new Date()));
    } catch {
        // Ignore storage errors
    }
}

export interface DailyNotificationData {
    currentStreak: number;
    tasksCompleted: number;
    tasksTotal: number;
    dailyScore: number;
    hasActivityToday: boolean;
}

/**
 * Schedule streak reminder if user hasn't been active today
 */
export function scheduleStreakReminder(data: DailyNotificationData): void {
    // Clear any existing timeout
    if (streakReminderTimeout) {
        clearTimeout(streakReminderTimeout);
        streakReminderTimeout = null;
    }

    // Don't schedule if notifications disabled or already notified today
    if (!isNotificationEnabled('streakReminder') || hasNotifiedToday(LAST_STREAK_REMINDER_KEY)) {
        return;
    }

    // Don't remind if user has activity today
    if (data.hasActivityToday) {
        console.log('[DailyNotifications] User has activity today, skipping streak reminder');
        return;
    }

    // Don't remind if no streak to protect
    if (data.currentStreak === 0) {
        return;
    }

    const delay = getMsUntilHour(STREAK_REMINDER_HOUR);

    streakReminderTimeout = setTimeout(() => {
        if (isNotificationEnabled('streakReminder') && !data.hasActivityToday) {
            showServiceWorkerNotification(
                '🔥 Don\'t Lose Your Streak!',
                `You have a ${data.currentStreak}-day streak. Complete a task to keep it going!`,
                {
                    tag: 'streak-reminder',
                    requireInteraction: true,
                    data: { type: 'streak' },
                }
            );
            markNotifiedToday(LAST_STREAK_REMINDER_KEY);
        }
        streakReminderTimeout = null;
    }, delay);

    console.log(`[DailyNotifications] Scheduled streak reminder in ${Math.round(delay / 1000 / 60)} minutes`);
}

/**
 * Schedule daily summary notification
 */
export function scheduleDailySummary(data: DailyNotificationData): void {
    // Clear any existing timeout
    if (dailySummaryTimeout) {
        clearTimeout(dailySummaryTimeout);
        dailySummaryTimeout = null;
    }

    // Don't schedule if notifications disabled or already notified today
    if (!isNotificationEnabled('dailySummary') || hasNotifiedToday(LAST_DAILY_SUMMARY_KEY)) {
        return;
    }

    const delay = getMsUntilHour(DAILY_SUMMARY_HOUR);

    dailySummaryTimeout = setTimeout(() => {
        if (isNotificationEnabled('dailySummary')) {
            const { tasksCompleted, tasksTotal, dailyScore, currentStreak } = data;

            let body = '';
            if (tasksTotal === 0) {
                body = 'No tasks scheduled today. Plan tomorrow\'s tasks!';
            } else {
                const emoji = dailyScore >= 80 ? '🎉' : dailyScore >= 50 ? '👍' : '💪';
                body = `${emoji} ${tasksCompleted}/${tasksTotal} tasks completed (${dailyScore}% score)`;
                if (currentStreak > 0) {
                    body += ` | 🔥 ${currentStreak}-day streak`;
                }
            }

            showServiceWorkerNotification(
                '📊 Daily Summary',
                body,
                {
                    tag: 'daily-summary',
                    data: { type: 'summary' },
                }
            );
            markNotifiedToday(LAST_DAILY_SUMMARY_KEY);
        }
        dailySummaryTimeout = null;
    }, delay);

    console.log(`[DailyNotifications] Scheduled daily summary in ${Math.round(delay / 1000 / 60)} minutes`);
}

/**
 * Initialize daily notification schedulers
 */
export function initializeDailyNotifications(data: DailyNotificationData): void {
    console.log('[DailyNotifications] Initializing with data:', data);
    scheduleStreakReminder(data);
    scheduleDailySummary(data);
}

/**
 * Update daily notification data (call when tasks/stats change)
 */
export function updateDailyNotificationData(data: DailyNotificationData): void {
    // If user now has activity, cancel streak reminder
    if (data.hasActivityToday && streakReminderTimeout) {
        clearTimeout(streakReminderTimeout);
        streakReminderTimeout = null;
        console.log('[DailyNotifications] User became active, cancelled streak reminder');
    }

    // Reschedule daily summary with updated data
    scheduleDailySummary(data);
}

/**
 * Clear all scheduled daily notifications
 */
export function clearDailyNotifications(): void {
    if (streakReminderTimeout) {
        clearTimeout(streakReminderTimeout);
        streakReminderTimeout = null;
    }
    if (dailySummaryTimeout) {
        clearTimeout(dailySummaryTimeout);
        dailySummaryTimeout = null;
    }
    console.log('[DailyNotifications] Cleared all daily notifications');
}

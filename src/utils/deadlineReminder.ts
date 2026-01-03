/**
 * Deadline Reminder Utility
 * Schedules notifications for tasks with deadlines
 */

import { Task } from '../../types';
import { showServiceWorkerNotification, isNotificationEnabled } from './notifications';

// Map of task ID to timeout ID for active reminders
const activeReminders = new Map<string, ReturnType<typeof setTimeout>>();

// How many minutes before deadline to send reminder
const REMINDER_MINUTES_BEFORE = 30;

// LocalStorage key for tracking scheduled reminders
const SCHEDULED_REMINDERS_KEY = 'dailydash_scheduled_reminders';

/**
 * Parse a deadline string (e.g., "2:30 PM") to a Date object for today
 */
function parseDeadlineToDate(deadlineStr: string, scheduledDate: string): Date | null {
    if (!deadlineStr) return null;

    try {
        // Parse the time string (e.g., "2:30 PM" or "14:30")
        const timeMatch = deadlineStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!timeMatch) return null;

        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3]?.toUpperCase();

        // Convert to 24-hour format if AM/PM is present
        if (period) {
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
        }

        // Create date from scheduled_date
        const [year, month, day] = scheduledDate.split('-').map(Number);
        const deadlineDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

        return deadlineDate;
    } catch (error) {
        console.error('Error parsing deadline:', error);
        return null;
    }
}

/**
 * Calculate milliseconds until reminder should fire
 */
function calculateReminderDelay(deadlineDate: Date): number | null {
    const now = new Date();
    const reminderTime = new Date(deadlineDate.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000);

    const delay = reminderTime.getTime() - now.getTime();

    // If reminder time has passed, don't schedule
    if (delay < 0) {
        return null;
    }

    return delay;
}

/**
 * Schedule a deadline reminder for a task
 */
export function scheduleDeadlineReminder(task: Task): void {
    // Don't schedule if notification disabled or task completed
    if (!isNotificationEnabled('deadlineReminder') || task.isCompleted) {
        return;
    }

    // Need deadline and scheduled_date
    if (!task.deadline || !task.scheduled_date) {
        return;
    }

    // Parse deadline to Date
    const deadlineDate = parseDeadlineToDate(task.deadline, task.scheduled_date);
    if (!deadlineDate) {
        return;
    }

    // Calculate delay until reminder
    const delay = calculateReminderDelay(deadlineDate);
    if (delay === null) {
        return;
    }

    // Clear any existing reminder for this task
    clearDeadlineReminder(task.id);

    // Schedule the reminder
    const timeoutId = setTimeout(() => {
        // Double-check permission before showing
        if (isNotificationEnabled('deadlineReminder')) {
            showServiceWorkerNotification(
                '⏰ Task Due Soon!',
                `"${task.title}" is due in ${REMINDER_MINUTES_BEFORE} minutes`,
                {
                    tag: `deadline-${task.id}`,
                    data: { taskId: task.id, type: 'deadline' },
                }
            );
        }
        // Remove from active reminders map
        activeReminders.delete(task.id);
    }, delay);

    // Store the timeout ID
    activeReminders.set(task.id, timeoutId);

    console.log(`[DeadlineReminder] Scheduled reminder for "${task.title}" in ${Math.round(delay / 1000 / 60)} minutes`);
}

/**
 * Clear a scheduled deadline reminder
 */
export function clearDeadlineReminder(taskId: string): void {
    const timeoutId = activeReminders.get(taskId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        activeReminders.delete(taskId);
        console.log(`[DeadlineReminder] Cleared reminder for task ${taskId}`);
    }
}

/**
 * Clear all scheduled deadline reminders
 */
export function clearAllReminders(): void {
    activeReminders.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    activeReminders.clear();
    console.log('[DeadlineReminder] Cleared all reminders');
}

/**
 * Schedule reminders for multiple tasks
 */
export function scheduleAllDeadlineReminders(tasks: Task[]): void {
    // Clear existing reminders first
    clearAllReminders();

    // Schedule reminders for tasks with deadlines
    tasks.forEach((task) => {
        if (task.deadline && !task.isCompleted) {
            scheduleDeadlineReminder(task);
        }
    });
}

/**
 * Update reminder when task is modified
 */
export function handleTaskUpdate(task: Task): void {
    if (task.isCompleted) {
        // Task completed - clear reminder
        clearDeadlineReminder(task.id);
    } else if (task.deadline) {
        // Reschedule with new deadline
        scheduleDeadlineReminder(task);
    } else {
        // No deadline - clear reminder
        clearDeadlineReminder(task.id);
    }
}

/**
 * Get count of active reminders (for debugging)
 */
export function getActiveReminderCount(): number {
    return activeReminders.size;
}

import { formatDate, addDays } from './dateUtils';

export const calculateStreak = (activityDates: string[]): number => {
    if (activityDates.length === 0) return 0;

    // Sort dates in descending order
    const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));

    const today = formatDate(new Date());
    const yesterday = formatDate(addDays(new Date(), -1));

    // Check if there's activity today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
        return 0; // Streak broken
    }

    let streak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
        const previousDate = formatDate(addDays(currentDate, -1));

        if (sortedDates[i] === previousDate) {
            streak++;
            currentDate = new Date(sortedDates[i]);
        } else {
            break; // Streak broken
        }
    }

    return streak;
};

export const shouldUpdateStreak = (lastActivityDate: string | null): boolean => {
    if (!lastActivityDate) return true;

    const today = formatDate(new Date());
    return lastActivityDate !== today;
};

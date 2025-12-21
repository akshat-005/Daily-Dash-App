import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE, d MMMM yyyy');
};

export const formatDeadlineTime = (time: string): string => {
    // Handle formats like "17:00:00" or "17:00" or "5:00 PM"
    if (!time) return '';

    // If already in 12-hour format, return as is
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
        return time;
    }

    // Parse 24-hour format
    const parts = time.split(':');
    let hours = parseInt(parts[0]);
    const minutes = parts[1] || '00';

    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight

    return `${hours}:${minutes} ${period}`;
};

export const checkIsToday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isToday(d);
};

export const getWeekDays = (date: Date = new Date()): Date[] => {
    const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return formatDate(d1) === formatDate(d2);
};

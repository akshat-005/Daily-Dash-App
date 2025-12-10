import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE, d MMMM yyyy');
};

export const formatTime = (time: string): string => {
    // Assuming time is in HH:MM format
    return time;
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

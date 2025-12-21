// Format time spent in hours (decimal) to readable format
export const formatTimeSpent = (hours: number): string => {
    if (hours === 0) return '0m';

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

// Format time difference (actual - estimated)
export const formatTimeDifference = (actual: number, estimated: number): string => {
    const diff = actual - estimated;
    const absDiff = Math.abs(diff);
    const sign = diff > 0 ? '+' : '';

    return `${sign}${formatTimeSpent(absDiff)}`;
};

// Check if time is over/under estimate
export const isOverEstimate = (actual: number, estimated: number): boolean => {
    return actual > estimated;
};

// Calculate percentage of estimate used
export const getEstimatePercentage = (actual: number, estimated: number): number => {
    if (estimated === 0) return 0;
    return Math.round((actual / estimated) * 100);
};

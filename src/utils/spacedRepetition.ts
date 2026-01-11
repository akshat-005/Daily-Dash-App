import { addDays } from './dateUtils';
import { DifficultyRating } from '../../types';

/**
 * Spaced repetition algorithm for calculating next review dates
 * Based on user's difficulty feedback:
 * - Easy → +14 days (mastered, space it out)
 * - Medium → +7 days (getting there, review again soon)
 * - Hard → +2 days (still struggling, review quickly)
 * 
 * The algorithm also considers review count for progressive spacing
 */

// Base intervals in days for each difficulty level
const BASE_INTERVALS = {
    easy: 14,
    medium: 7,
    hard: 2,
} as const;

/**
 * Calculate the next review date based on difficulty rating and review history
 */
export function calculateNextReviewDate(
    difficulty: DifficultyRating,
    reviewCount: number,
    baseDate: Date = new Date()
): Date {
    const baseInterval = BASE_INTERVALS[difficulty];

    // Progressive spacing: multiply by review count for 'easy' items
    // This creates longer gaps as items are mastered
    // Cap the multiplier at 4 to avoid extremely long gaps
    let adjustedDays = baseInterval;

    if (difficulty === 'easy' && reviewCount > 0) {
        const multiplier = Math.min(reviewCount + 1, 4);
        adjustedDays = baseInterval * multiplier;
    }

    return addDays(baseDate, adjustedDays);
}

/**
 * Get a human-readable description of when the next review will be
 */
export function getNextReviewDescription(difficulty: DifficultyRating, reviewCount: number): string {
    const nextDate = calculateNextReviewDate(difficulty, reviewCount);
    const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 14) return `In ${Math.ceil(diffDays / 7)} week${diffDays > 7 ? 's' : ''}`;
    return `In ${Math.ceil(diffDays / 7)} weeks`;
}

/**
 * Calculate preset dates for quick capture
 */
export function getPresetDates(): { label: string; days: number; date: Date }[] {
    const today = new Date();
    return [
        { label: 'Tomorrow', days: 1, date: addDays(today, 1) },
        { label: '3 days', days: 3, date: addDays(today, 3) },
        { label: '1 week', days: 7, date: addDays(today, 7) },
        { label: '2 weeks', days: 14, date: addDays(today, 14) },
    ];
}

/**
 * Format estimated time for display
 */
export function formatEstimatedTime(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
}

/**
 * Get color class for difficulty level
 */
export function getDifficultyColor(difficulty: DifficultyRating): string {
    switch (difficulty) {
        case 'easy': return 'text-emerald-400';
        case 'medium': return 'text-amber-400';
        case 'hard': return 'text-red-400';
    }
}

/**
 * Get icon/emoji for revisit type
 */
export function getRevisitTypeIcon(type: string): string {
    switch (type) {
        case 'tech': return '💻';
        case 'leetcode': return '🧩';
        case 'math': return '📐';
        case 'college': return '🎓';
        case 'book': return '📚';
        default: return '📌';
    }
}

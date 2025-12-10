export interface Task {
    id: string;
    user_id: string;
    title: string;
    category: string;
    categoryColor: CategoryColor;
    progress: number;
    estimatedHours: number;
    deadline?: string; // Time in HH:MM AM/PM format
    scheduled_date: string;
    isCompleted: boolean;
    completed_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Day {
    day: number;
    status: 'high' | 'medium' | 'low' | 'none' | 'future';
    isToday: boolean;
}

export type FilterType = 'All Tasks' | 'Deep Work' | 'Meetings' | 'Health';

export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Reflection {
    id: string;
    user_id: string;
    reflection_date: string; // ISO date string
    what_went_well: string;
    needs_improvement: string;
    plan_tomorrow: string;
    created_at: string;
    updated_at: string;
}

export interface DailyStats {
    id: string;
    user_id: string;
    stat_date: string; // ISO date string
    daily_score: number; // 0-100
    tasks_completed: number;
    tasks_total: number;
    productivity_level: 'high' | 'medium' | 'low';
    created_at: string;
}

export interface Streak {
    id: string;
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string; // ISO date string
    updated_at: string;
}

export type CategoryColor = 'indigo' | 'primary' | 'emerald' | 'purple' | 'pink';

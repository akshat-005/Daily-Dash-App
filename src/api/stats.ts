import { supabase } from '../lib/supabase';
import { DailyStats, Streak, Task } from '../../types';
import { calculateDailyScore, getProductivityLevel } from '../utils/scoreCalculator';
import { calculateStreak, shouldUpdateStreak } from '../utils/streakCalculator';
import { formatDate, addDays } from '../utils/dateUtils';

export const fetchStreak = async (userId: string): Promise<Streak | null> => {
    const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data;
};

export const fetchDailyStats = async (userId: string, date: string): Promise<DailyStats | null> => {
    const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('stat_date', date)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data;
};

export const fetchWeeklyMomentum = async (userId: string): Promise<DailyStats[]> => {
    const today = new Date();
    const weekAgo = addDays(today, -6);

    const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('stat_date', formatDate(weekAgo))
        .lte('stat_date', formatDate(today))
        .order('stat_date', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const calculateAndSaveDailyScore = async (
    userId: string,
    date: string,
    tasks: Task[],
    hasReflection: boolean
): Promise<DailyStats> => {
    const tasksCompleted = tasks.filter(t => t.isCompleted).length;
    const tasksTotal = tasks.length;

    const daily_score = calculateDailyScore({
        tasksCompleted,
        tasksTotal,
        tasks,
        hasReflection,
    });

    const productivity_level = getProductivityLevel(daily_score);

    // Upsert daily stats
    const { data, error } = await supabase
        .from('daily_stats')
        .upsert({
            user_id: userId,
            stat_date: date,
            daily_score,
            tasks_completed: tasksCompleted,
            tasks_total: tasksTotal,
            productivity_level,
        }, {
            onConflict: 'user_id,stat_date',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateStreak = async (userId: string): Promise<Streak> => {
    // Fetch all daily stats with score > 55 to calculate streak
    const { data: stats, error: statsError } = await supabase
        .from('daily_stats')
        .select('stat_date, daily_score')
        .eq('user_id', userId)
        .gt('daily_score', 55) // Only count days with score > 55%
        .order('stat_date', { ascending: false });

    if (statsError) throw statsError;

    const activityDates = (stats || []).map(s => s.stat_date);
    const current_streak = calculateStreak(activityDates);

    // Fetch existing streak
    const { data: existing } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    const longest_streak = existing
        ? Math.max(existing.longest_streak, current_streak)
        : current_streak;

    const today = formatDate(new Date());

    // Upsert streak
    const { data, error } = await supabase
        .from('streaks')
        .upsert({
            user_id: userId,
            current_streak,
            longest_streak,
            last_activity_date: today,
        }, {
            onConflict: 'user_id',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

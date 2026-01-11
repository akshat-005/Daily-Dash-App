import { supabase } from '../lib/supabase';
import { RevisitItem, CreateRevisitInput, DifficultyRating, RevisitType, EstimatedTime } from '../../types';
import { calculateNextReviewDate } from '../utils/spacedRepetition';
import { formatDate } from '../utils/dateUtils';

// Transform database row to app format
const transformRevisit = (row: any): RevisitItem => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    type: row.type as RevisitType,
    resource_url: row.resource_url,
    reason_to_return: row.reason_to_return,
    notes: row.notes,
    estimated_time_min: row.estimated_time_min as EstimatedTime,
    difficulty: row.difficulty,
    review_count: row.review_count,
    status: row.status,
    created_at: row.created_at,
    last_reviewed_at: row.last_reviewed_at,
    next_review_at: row.next_review_at,
    updated_at: row.updated_at,
});

/**
 * Fetch all revisits for a user (all statuses)
 */
export const fetchRevisits = async (userId: string): Promise<RevisitItem[]> => {
    const { data, error } = await supabase
        .from('revisits')
        .select('*')
        .eq('user_id', userId)
        .order('next_review_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformRevisit);
};

/**
 * Fetch revisits due on a specific date
 */
export const fetchRevisitsDueOn = async (userId: string, date: string): Promise<RevisitItem[]> => {
    const { data, error } = await supabase
        .from('revisits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('next_review_at', date)
        .order('estimated_time_min', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformRevisit);
};

/**
 * Fetch revisits due in the next N days
 */
export const fetchUpcomingRevisits = async (userId: string, days: number = 7): Promise<RevisitItem[]> => {
    const today = formatDate(new Date());
    const futureDate = formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

    const { data, error } = await supabase
        .from('revisits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('next_review_at', today)
        .lte('next_review_at', futureDate)
        .order('next_review_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformRevisit);
};

/**
 * Create a new revisit item
 */
export const createRevisit = async (input: CreateRevisitInput): Promise<RevisitItem> => {
    const { data, error } = await supabase
        .from('revisits')
        .insert({
            user_id: input.user_id,
            title: input.title,
            type: input.type || 'misc',
            resource_url: input.resource_url,
            reason_to_return: input.reason_to_return,
            notes: input.notes,
            estimated_time_min: input.estimated_time_min || 15,
            next_review_at: input.next_review_at,
        })
        .select()
        .single();

    if (error) throw error;
    return transformRevisit(data);
};

/**
 * Update a revisit item
 */
export const updateRevisit = async (id: string, updates: Partial<RevisitItem>): Promise<RevisitItem> => {
    const dbUpdates: any = {};

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.resource_url !== undefined) dbUpdates.resource_url = updates.resource_url;
    if (updates.reason_to_return !== undefined) dbUpdates.reason_to_return = updates.reason_to_return;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.estimated_time_min !== undefined) dbUpdates.estimated_time_min = updates.estimated_time_min;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.next_review_at !== undefined) dbUpdates.next_review_at = updates.next_review_at;
    if (updates.last_reviewed_at !== undefined) dbUpdates.last_reviewed_at = updates.last_reviewed_at;
    if (updates.review_count !== undefined) dbUpdates.review_count = updates.review_count;

    const { data, error } = await supabase
        .from('revisits')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return transformRevisit(data);
};

/**
 * Complete a revisit and calculate next review date based on difficulty
 */
export const completeRevisit = async (
    id: string,
    difficulty: DifficultyRating,
    reviewCount: number
): Promise<RevisitItem> => {
    const nextReviewDate = calculateNextReviewDate(difficulty, reviewCount);

    // Convert difficulty to numeric (1-5 scale)
    const numericDifficulty = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1;

    const { data, error } = await supabase
        .from('revisits')
        .update({
            difficulty: numericDifficulty,
            review_count: reviewCount + 1,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: formatDate(nextReviewDate),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return transformRevisit(data);
};

/**
 * Snooze a revisit by delaying it by a number of days
 */
export const snoozeRevisit = async (id: string, days: number): Promise<RevisitItem> => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);

    const { data, error } = await supabase
        .from('revisits')
        .update({
            next_review_at: formatDate(nextDate),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return transformRevisit(data);
};

/**
 * Archive a revisit (completed learning)
 */
export const archiveRevisit = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('revisits')
        .update({ status: 'archived' })
        .eq('id', id);

    if (error) throw error;
};

/**
 * Mark a revisit as done (fully mastered)
 */
export const markRevisitDone = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('revisits')
        .update({
            status: 'done',
            last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
};

/**
 * Delete a revisit
 */
export const deleteRevisit = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('revisits')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

/**
 * Get revisit statistics for a user
 */
export const getRevisitStats = async (userId: string): Promise<{
    dueToday: number;
    totalActive: number;
    completedThisWeek: number;
    totalMinutesToday: number;
}> => {
    const today = formatDate(new Date());
    const weekAgo = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    // Get due today
    const { data: dueTodayData, error: error1 } = await supabase
        .from('revisits')
        .select('id, estimated_time_min')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('next_review_at', today);

    if (error1) throw error1;

    // Get total active
    const { count: totalActive, error: error2 } = await supabase
        .from('revisits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

    if (error2) throw error2;

    // Get completed this week
    const { count: completedThisWeek, error: error3 } = await supabase
        .from('revisits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('last_reviewed_at', weekAgo);

    if (error3) throw error3;

    const totalMinutesToday = (dueTodayData || []).reduce(
        (sum, item) => sum + (item.estimated_time_min || 15),
        0
    );

    return {
        dueToday: dueTodayData?.length || 0,
        totalActive: totalActive || 0,
        completedThisWeek: completedThisWeek || 0,
        totalMinutesToday,
    };
};

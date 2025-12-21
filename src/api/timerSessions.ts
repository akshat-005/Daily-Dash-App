import { supabase } from '../lib/supabase';
import { TimerSession } from '../../types';

export const startTimerSession = async (taskId: string, userId: string): Promise<TimerSession> => {
    const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
            task_id: taskId,
            user_id: userId,
            started_at: new Date().toISOString(),
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const stopTimerSession = async (sessionId: string): Promise<TimerSession> => {
    const endedAt = new Date().toISOString();

    // First, get the session to calculate duration
    const { data: session, error: fetchError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (fetchError) throw fetchError;

    // Calculate duration in seconds
    const startTime = new Date(session.started_at).getTime();
    const endTime = new Date(endedAt).getTime();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Update the session
    const { data, error } = await supabase
        .from('timer_sessions')
        .update({
            ended_at: endedAt,
            duration_seconds: durationSeconds,
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;

    // Update task's time_spent
    await updateTaskTimeSpent(session.task_id);

    return data;
};

export const getActiveSession = async (taskId: string): Promise<TimerSession | null> => {
    const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const getTaskSessions = async (taskId: string): Promise<TimerSession[]> => {
    const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('task_id', taskId)
        .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

const updateTaskTimeSpent = async (taskId: string): Promise<void> => {
    // Get all completed sessions for this task
    const { data: sessions, error: sessionsError } = await supabase
        .from('timer_sessions')
        .select('duration_seconds')
        .eq('task_id', taskId)
        .eq('is_active', false)
        .not('duration_seconds', 'is', null);

    if (sessionsError) throw sessionsError;

    // Calculate total time in hours
    const totalSeconds = sessions?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
    const totalHours = totalSeconds / 3600;

    // Update task
    const { error: updateError } = await supabase
        .from('tasks')
        .update({ time_spent: totalHours })
        .eq('id', taskId);

    if (updateError) throw updateError;
};

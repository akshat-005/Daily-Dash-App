import { supabase } from '../lib/supabase';
import { TimerSession } from '../../types';

export const startTimerSession = async (
    taskId: string,
    userId: string,
    timerDurationSeconds?: number
): Promise<TimerSession> => {
    const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
            task_id: taskId,
            user_id: userId,
            started_at: new Date().toISOString(),
            is_active: true,
            timer_duration_seconds: timerDurationSeconds,
            is_paused: false,
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
    let durationSeconds: number;

    if (session.is_stopwatch && session.stopwatch_started_at) {
        // If in stopwatch mode, add stopwatch time to the existing duration
        const stopwatchStartTime = new Date(session.stopwatch_started_at).getTime();
        const stopwatchEndTime = new Date(endedAt).getTime();
        const stopwatchSeconds = Math.floor((stopwatchEndTime - stopwatchStartTime) / 1000);

        // Total = timer duration + stopwatch duration
        durationSeconds = (session.duration_seconds || 0) + stopwatchSeconds;
    } else {
        // Normal timer/stopwatch - calculate from start to end
        const startTime = new Date(session.started_at).getTime();
        const endTime = new Date(endedAt).getTime();
        durationSeconds = Math.floor((endTime - startTime) / 1000);
    }

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

// Complete a timer session when countdown reaches zero
export const completeTimerSession = async (sessionId: string): Promise<TimerSession> => {
    const completedAt = new Date().toISOString();

    // First, get the session to calculate duration
    const { data: session, error: fetchError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (fetchError) throw fetchError;

    // For a completed timer, duration should be the full timer_duration_seconds
    const durationSeconds = session.timer_duration_seconds || 0;

    // Update the session - mark as completed but keep is_active true for stopwatch
    const { data, error } = await supabase
        .from('timer_sessions')
        .update({
            duration_seconds: durationSeconds,
            updated_at: completedAt,
        })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;

    // Update task's time_spent with the timer duration
    await updateTaskTimeSpent(session.task_id);

    return data;
};

// Convert a completed timer to stopwatch mode
export const convertToStopwatch = async (sessionId: string): Promise<TimerSession> => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('timer_sessions')
        .update({
            is_stopwatch: true,
            stopwatch_started_at: now,
            updated_at: now,
        })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
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

// Pause or resume a timer session
export const pauseTimerSession = async (sessionId: string, isPaused: boolean): Promise<TimerSession> => {
    // First get the current session to calculate time adjustments
    const { data: currentSession, error: fetchError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (fetchError) throw fetchError;

    let updateData: any = {
        is_paused: isPaused,
        updated_at: new Date().toISOString(),
    };

    if (isPaused) {
        // Pausing: record when we paused
        updateData.paused_at = new Date().toISOString();
    } else {
        // Resuming: adjust time to account for paused duration
        if (currentSession.paused_at) {
            const pauseDuration = Date.now() - new Date(currentSession.paused_at).getTime();

            if (currentSession.is_stopwatch && currentSession.stopwatch_started_at) {
                // For stopwatch mode, adjust stopwatch_started_at
                const newStopwatchStartedAt = new Date(new Date(currentSession.stopwatch_started_at).getTime() + pauseDuration);
                updateData.stopwatch_started_at = newStopwatchStartedAt.toISOString();
            } else {
                // For timer mode, adjust started_at
                const newStartedAt = new Date(new Date(currentSession.started_at).getTime() + pauseDuration);
                updateData.started_at = newStartedAt.toISOString();
            }
        }
        updateData.paused_at = null;
    }

    const { data, error } = await supabase
        .from('timer_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Get all active sessions for a user (for initial load and sync)
export const getActiveSessionsForUser = async (userId: string): Promise<TimerSession[]> => {
    const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// Calculate remaining seconds for a timer based on database state
export const calculateRemainingSeconds = (session: TimerSession): number => {
    if (!session.timer_duration_seconds) return 0;

    const now = new Date().getTime();
    const startTime = new Date(session.started_at).getTime();

    // Calculate elapsed time
    let elapsedSeconds: number;

    if (session.is_paused && session.paused_at) {
        // If paused, calculate elapsed time up to pause point
        const pauseTime = new Date(session.paused_at).getTime();
        elapsedSeconds = Math.floor((pauseTime - startTime) / 1000);
    } else {
        // If running, calculate elapsed time up to now
        elapsedSeconds = Math.floor((now - startTime) / 1000);
    }

    // Calculate remaining time
    const remaining = session.timer_duration_seconds - elapsedSeconds;
    return Math.max(0, remaining); // Don't go negative
};

// Calculate elapsed seconds for stopwatch mode
export const calculateStopwatchSeconds = (session: TimerSession): number => {
    if (!session.is_stopwatch || !session.stopwatch_started_at) return 0;

    const now = new Date().getTime();
    const stopwatchStartTime = new Date(session.stopwatch_started_at).getTime();

    // Calculate elapsed time
    let elapsedSeconds: number;

    if (session.is_paused && session.paused_at) {
        // If paused, calculate elapsed time up to pause point
        const pauseTime = new Date(session.paused_at).getTime();
        elapsedSeconds = Math.floor((pauseTime - stopwatchStartTime) / 1000);
    } else {
        // If running, calculate elapsed time up to now
        elapsedSeconds = Math.floor((now - stopwatchStartTime) / 1000);
    }

    return elapsedSeconds;
};

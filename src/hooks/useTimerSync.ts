import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TimerSession } from '../../types';
import * as timerSessionsApi from '../api/timerSessions';
import toast from 'react-hot-toast';
import { showServiceWorkerNotification, requestNotificationPermission, isNotificationEnabled } from '../utils/notifications';

interface TimerState {
    seconds: number;
    isRunning: boolean;
    sessionId: string;
    isStopwatch: boolean; // Whether in stopwatch mode (counting up)
}

export const useTimerSync = (userId: string, currentDate: Date) => {
    // Store the actual session data instead of just seconds
    const [activeSessions, setActiveSessions] = useState<Record<string, TimerSession>>({});
    const subscriptionRef = useRef<any>(null);
    const [, setTick] = useState(0); // Force re-render every second

    // Load active sessions on mount
    useEffect(() => {
        const loadActiveSessions = async () => {
            try {
                const sessions = await timerSessionsApi.getActiveSessionsForUser(userId);

                const sessionsMap: Record<string, TimerSession> = {};
                sessions.forEach((session) => {
                    // Include stopwatch sessions (is_stopwatch = true)
                    if (session.is_stopwatch) {
                        sessionsMap[session.task_id] = session;
                    } else {
                        // For timer sessions, only include if they have remaining time
                        const remainingSeconds = timerSessionsApi.calculateRemainingSeconds(session);
                        if (remainingSeconds > 0) {
                            sessionsMap[session.task_id] = session;
                        }
                    }
                });

                setActiveSessions(sessionsMap);
            } catch (error) {
                console.error('Failed to load active sessions:', error);
            }
        };

        loadActiveSessions();
    }, [userId]);

    // Subscribe to realtime changes
    useEffect(() => {
        const channel = supabase
            .channel('timer_sessions_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timer_sessions',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    handleRealtimeChange(payload);
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [userId]);

    // Update tick every second to force recalculation of remaining time
    useEffect(() => {
        const interval = setInterval(async () => {
            setTick(prev => prev + 1);

            // Check if any timers have completed
            setActiveSessions(prev => {
                const updated = { ...prev };

                // Check for completed timers
                Object.keys(updated).forEach(async (taskId) => {
                    const session = updated[taskId];

                    // Skip if already in stopwatch mode
                    if (session.is_stopwatch) return;

                    const remaining = timerSessionsApi.calculateRemainingSeconds(session);

                    if (remaining === 0 && !session.is_paused) {
                        // Timer completed! Save time and convert to stopwatch
                        try {
                            // Complete the timer session (saves time to database)
                            await timerSessionsApi.completeTimerSession(session.id);

                            // Convert to stopwatch mode
                            const stopwatchSession = await timerSessionsApi.convertToStopwatch(session.id);

                            // Update state with the stopwatch session
                            setActiveSessions(current => ({
                                ...current,
                                [taskId]: stopwatchSession,
                            }));

                            toast.success('Timer completed! Stopwatch started 🎉', { duration: 5000 });

                            // Show browser notification for timer completion
                            if (isNotificationEnabled('timerComplete')) {
                                const durationMinutes = Math.round((session.timer_duration_seconds || 0) / 60);
                                showServiceWorkerNotification(
                                    '⏰ Timer Complete!',
                                    `Your ${durationMinutes} minute timer has finished`,
                                    {
                                        tag: `timer-complete-${session.id}`,
                                        data: { taskId, type: 'timer' },
                                    }
                                );
                            }
                        } catch (error) {
                            console.error('Failed to complete timer:', error);
                            toast.error('Failed to complete timer');
                        }
                    }
                });

                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleRealtimeChange = useCallback((payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const session = newRecord as TimerSession;

            if (session.is_active) {
                // Handle stopwatch mode
                if (session.is_stopwatch) {
                    setActiveSessions((prev) => ({
                        ...prev,
                        [session.task_id]: session,
                    }));
                } else if (session.timer_duration_seconds) {
                    // Handle timer mode
                    const remainingSeconds = timerSessionsApi.calculateRemainingSeconds(session);

                    if (remainingSeconds > 0) {
                        setActiveSessions((prev) => ({
                            ...prev,
                            [session.task_id]: session,
                        }));
                    } else {
                        // Timer has completed, remove it (will be handled by local completion logic)
                        setActiveSessions((prev) => {
                            const updated = { ...prev };
                            delete updated[session.task_id];
                            return updated;
                        });
                    }
                }
            } else if (!session.is_active) {
                // Timer stopped, remove from active timers
                setActiveSessions((prev) => {
                    const updated = { ...prev };
                    delete updated[session.task_id];
                    return updated;
                });
            }
        } else if (eventType === 'DELETE') {
            const session = oldRecord as TimerSession;
            setActiveSessions((prev) => {
                const updated = { ...prev };
                delete updated[session.task_id];
                return updated;
            });
        }
    }, []);

    // Convert sessions to timer state format for components
    const activeTimers: Record<string, TimerState> = {};
    Object.keys(activeSessions).forEach(taskId => {
        const session = activeSessions[taskId];

        if (session.is_stopwatch) {
            // Stopwatch mode - count up from 0
            const stopwatchSeconds = timerSessionsApi.calculateStopwatchSeconds(session);
            activeTimers[taskId] = {
                seconds: stopwatchSeconds,
                isRunning: !session.is_paused,
                sessionId: session.id,
                isStopwatch: true,
            };
        } else {
            // Timer mode - count down
            const remainingSeconds = timerSessionsApi.calculateRemainingSeconds(session);

            if (remainingSeconds > 0) {
                activeTimers[taskId] = {
                    seconds: remainingSeconds,
                    isRunning: !session.is_paused,
                    sessionId: session.id,
                    isStopwatch: false,
                };
            }
        }
    });

    const startTimer = useCallback(async (taskId: string, durationMinutes: number) => {
        const totalSeconds = durationMinutes * 60;

        try {
            // Request notification permission on first timer start
            await requestNotificationPermission();

            const session = await timerSessionsApi.startTimerSession(
                taskId,
                userId,
                totalSeconds
            );

            // Optimistically update local state
            setActiveSessions((prev) => ({
                ...prev,
                [taskId]: session,
            }));

            toast.success('Timer started!');
            return session;
        } catch (error) {
            console.error('Failed to start timer:', error);
            toast.error('Failed to start timer');
            throw error;
        }
    }, [userId]);

    const stopTimer = useCallback(async (taskId: string) => {
        const session = activeSessions[taskId];
        if (!session?.id) return;

        try {
            await timerSessionsApi.stopTimerSession(session.id);

            // Remove from local state (will also be updated by realtime)
            setActiveSessions((prev) => {
                const updated = { ...prev };
                delete updated[taskId];
                return updated;
            });

            toast.success('Timer stopped');
        } catch (error) {
            console.error('Failed to stop timer:', error);
            toast.error('Failed to stop timer');
        }
    }, [activeSessions]);

    const pauseTimer = useCallback(async (taskId: string) => {
        const session = activeSessions[taskId];
        if (!session?.id) return;

        try {
            const updatedSession = await timerSessionsApi.pauseTimerSession(session.id, true);

            // Update local state
            setActiveSessions((prev) => ({
                ...prev,
                [taskId]: updatedSession,
            }));
        } catch (error) {
            console.error('Failed to pause timer:', error);
            toast.error('Failed to pause timer');
        }
    }, [activeSessions]);

    const resumeTimer = useCallback(async (taskId: string) => {
        const session = activeSessions[taskId];
        if (!session?.id) return;

        try {
            const updatedSession = await timerSessionsApi.pauseTimerSession(session.id, false);

            // Update local state
            setActiveSessions((prev) => ({
                ...prev,
                [taskId]: updatedSession,
            }));
        } catch (error) {
            console.error('Failed to resume timer:', error);
            toast.error('Failed to resume timer');
        }
    }, [activeSessions]);

    const toggleTimer = useCallback(async (taskId: string) => {
        const session = activeSessions[taskId];
        if (!session) return;

        if (!session.is_paused) {
            await pauseTimer(taskId);
        } else {
            await resumeTimer(taskId);
        }
    }, [activeSessions, pauseTimer, resumeTimer]);

    return {
        activeTimers,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        toggleTimer,
    };
};


import { create } from 'zustand';
import { Task, FilterType } from '../../types';
import * as taskApi from '../api/tasks';
import { supabase } from '../lib/supabase';

interface TaskStore {
    tasks: Task[];
    filter: FilterType;
    loading: boolean;
    error: string | null;

    setFilter: (filter: FilterType) => void;
    fetchTasks: (userId: string, date: string) => Promise<void>;
    createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateProgress: (id: string, progress: number) => Promise<void>;
    toggleComplete: (id: string, isCompleted: boolean) => Promise<void>;
    linkToLongerTask: (dailyTaskId: string, longerTaskId: string | null) => Promise<void>;
    updateLinkedLongerTaskProgress: (longerTaskId: string) => Promise<void>;
    subscribeToTasks: (userId: string, date: string) => () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    tasks: [],
    filter: 'All Tasks',
    loading: false,
    error: null,

    setFilter: (filter) => set({ filter }),

    fetchTasks: async (userId, date) => {
        set({ loading: true, error: null });
        try {
            const tasks = await taskApi.fetchTasks(userId, date);
            set({ tasks, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createTask: async (task) => {
        set({ loading: true, error: null });
        try {
            const newTask = await taskApi.createTask(task);
            set((state) => ({
                tasks: [...state.tasks, newTask],
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateTask: async (id, updates) => {
        try {
            const updatedTask = await taskApi.updateTask(id, updates);
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteTask: async (id) => {
        try {
            await taskApi.deleteTask(id);
            set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== id),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateProgress: async (id, progress) => {
        const task = get().tasks.find(t => t.id === id);

        // Optimistically update UI
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id ? { ...task, progress } : task
            ),
        }));

        try {
            await taskApi.updateProgress(id, progress);

            // If linked to a longer task, update its progress
            if (task?.long_task_id) {
                await get().updateLinkedLongerTaskProgress(task.long_task_id);
            }

            // Update stats after progress change
            if (task) {
                const { user_id, scheduled_date } = task;
                const allTasks = get().tasks.map((t) => (t.id === id ? { ...t, progress } : t));
                const dailyTasks = allTasks.filter(t => !t.is_longer_task);

                // Import stats functions dynamically
                const { calculateAndSaveDailyScore, updateStreak } = await import('../api/stats');
                const { useStatsStore } = await import('./statsStore');

                try {
                    // Update daily score
                    await calculateAndSaveDailyScore(user_id, scheduled_date, dailyTasks, false);

                    // Update streak
                    await updateStreak(user_id);

                    // Refresh stats in the store
                    const statsStore = useStatsStore.getState();
                    await statsStore.fetchDailyStats(user_id, scheduled_date);
                    await statsStore.fetchStreak(user_id);
                    await statsStore.fetchWeeklyMomentum(user_id);
                } catch (statsError) {
                    console.error('Failed to update stats:', statsError);
                }
            }
        } catch (error: any) {
            console.error('Failed to update progress:', error);
            // Revert on error
            await get().fetchTasks(
                get().tasks[0]?.user_id || '',
                get().tasks[0]?.scheduled_date || ''
            );
            set({ error: error.message });
        }
    },

    linkToLongerTask: async (dailyTaskId, longerTaskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ long_task_id: longerTaskId })
                .eq('id', dailyTaskId);

            if (error) throw error;

            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === dailyTaskId ? { ...t, long_task_id: longerTaskId } : t
                ),
            }));

            // Update longer task progress if linking (not unlinking)
            if (longerTaskId) {
                await get().updateLinkedLongerTaskProgress(longerTaskId);
            }
        } catch (error: any) {
            console.error('Failed to link task:', error);
            set({ error: error.message });
            throw error;
        }
    },

    updateLinkedLongerTaskProgress: async (longerTaskId) => {
        try {
            // Fetch the longer task to get its total estimated hours
            const { data: longerTask, error: longerTaskError } = await supabase
                .from('tasks')
                .select('estimated_hours')
                .eq('id', longerTaskId)
                .single();

            if (longerTaskError) throw longerTaskError;

            const longerTaskTotalHours = longerTask?.estimated_hours || 0;

            // Fetch all daily tasks linked to this longer task
            const { data: linkedTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('long_task_id', longerTaskId)
                .or('is_longer_task.eq.false,is_longer_task.is.null');

            if (error) throw error;

            if (!linkedTasks || linkedTasks.length === 0) {
                // No linked tasks, set progress to 0
                await supabase
                    .from('tasks')
                    .update({ progress: 0 })
                    .eq('id', longerTaskId);
                return;
            }

            let newProgress = 0;

            if (longerTaskTotalHours > 0) {
                // Calculate completed hours from all linked daily tasks
                const completedHours = linkedTasks.reduce((sum, t) =>
                    sum + ((t.estimated_hours || 0) * (t.progress || 0) / 100), 0
                );

                // Progress = (completed hours / longer task's total hours) * 100
                newProgress = Math.round((completedHours / longerTaskTotalHours) * 100);
            } else {
                // Fallback: Average progress of all linked tasks if no total hours set
                const totalProgress = linkedTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
                newProgress = Math.round(totalProgress / linkedTasks.length);
            }

            // Cap at 100%
            newProgress = Math.min(100, Math.max(0, newProgress));

            // Update longer task progress
            await supabase
                .from('tasks')
                .update({
                    progress: newProgress,
                    is_completed: newProgress === 100,
                    completed_at: newProgress === 100 ? new Date().toISOString() : null,
                })
                .eq('id', longerTaskId);

        } catch (error: any) {
            console.error('Failed to update longer task progress:', error);
        }
    },

    toggleComplete: async (id, isCompleted) => {
        try {
            const updatedTask = await taskApi.toggleComplete(id, isCompleted);
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            }));

            // Update stats after completing/uncompleting a task
            const { user_id, scheduled_date } = updatedTask;
            const allTasks = get().tasks.map((t) => (t.id === id ? updatedTask : t));

            // Filter out longer tasks - only count daily tasks for score
            const dailyTasks = allTasks.filter(t => !t.is_longer_task);

            // Import stats functions dynamically to avoid circular dependency
            const { calculateAndSaveDailyScore, updateStreak } = await import('../api/stats');
            const { useStatsStore } = await import('./statsStore');

            try {
                // Update daily score (only with daily tasks, not longer tasks)
                await calculateAndSaveDailyScore(user_id, scheduled_date, dailyTasks, false);

                // Update streak
                await updateStreak(user_id);

                // Refresh stats in the store
                const statsStore = useStatsStore.getState();
                await statsStore.fetchDailyStats(user_id, scheduled_date);
                await statsStore.fetchStreak(user_id);
                await statsStore.fetchWeeklyMomentum(user_id);
            } catch (statsError) {
                console.error('Failed to update stats:', statsError);
                // Don't throw - stats update failure shouldn't block task completion
            }
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    subscribeToTasks: (userId, date) => {
        const subscription = supabase
            .channel('tasks')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newTask = payload.new as any;
                        if (newTask.scheduled_date === date) {
                            set((state) => ({
                                tasks: [...state.tasks, {
                                    id: newTask.id,
                                    user_id: newTask.user_id,
                                    title: newTask.title,
                                    category: newTask.category,
                                    categoryColor: newTask.category_color,
                                    progress: newTask.progress,
                                    estimatedHours: newTask.estimated_hours,
                                    deadline: newTask.deadline,
                                    scheduled_date: newTask.scheduled_date,
                                    isCompleted: newTask.is_completed,
                                    completed_at: newTask.completed_at,
                                    created_at: newTask.created_at,
                                    updated_at: newTask.updated_at,
                                }],
                            }));
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedTask = payload.new as any;
                        set((state) => ({
                            tasks: state.tasks.map((t) =>
                                t.id === updatedTask.id
                                    ? {
                                        id: updatedTask.id,
                                        user_id: updatedTask.user_id,
                                        title: updatedTask.title,
                                        category: updatedTask.category,
                                        categoryColor: updatedTask.category_color,
                                        progress: updatedTask.progress,
                                        estimatedHours: updatedTask.estimated_hours,
                                        deadline: updatedTask.deadline,
                                        scheduled_date: updatedTask.scheduled_date,
                                        isCompleted: updatedTask.is_completed,
                                        completed_at: updatedTask.completed_at,
                                        created_at: updatedTask.created_at,
                                        updated_at: updatedTask.updated_at,
                                    }
                                    : t
                            ),
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        set((state) => ({
                            tasks: state.tasks.filter((t) => t.id !== payload.old.id),
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },
}));

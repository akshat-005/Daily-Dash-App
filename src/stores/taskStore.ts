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
        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, progress } : t)),
        }));

        try {
            await taskApi.updateProgress(id, progress);
        } catch (error: any) {
            // Revert on error
            get().fetchTasks(get().tasks[0]?.user_id || '', get().tasks[0]?.scheduled_date || '');
            set({ error: error.message });
        }
    },

    toggleComplete: async (id, isCompleted) => {
        try {
            const updatedTask = await taskApi.toggleComplete(id, isCompleted);
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            }));
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
                                    startTime: newTask.start_time,
                                    endTime: newTask.end_time,
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
                                        startTime: updatedTask.start_time,
                                        endTime: updatedTask.end_time,
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

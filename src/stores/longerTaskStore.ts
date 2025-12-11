import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { LongerTask } from '../../types';

interface LongerTaskStore {
    longerTasks: LongerTask[];
    isLoading: boolean;
    fetchLongerTasks: (userId: string) => Promise<void>;
    createLongerTask: (task: Omit<LongerTask, 'id' | 'created_at' | 'updated_at' | 'progress' | 'is_longer_task'>) => Promise<void>;
    updateLongerTask: (id: string, updates: { title?: string; description?: string; deadline?: string; estimatedHours?: number }) => Promise<void>;
    updateLongerTaskProgress: (id: string, progress: number) => Promise<void>;
    deleteLongerTask: (id: string) => Promise<void>;
}

export const useLongerTaskStore = create<LongerTaskStore>((set, get) => ({
    longerTasks: [],
    isLoading: false,

    fetchLongerTasks: async (userId: string) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .eq('is_longer_task', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Extract deadline from description if present
            const longerTasks = (data || []).map((task) => {
                const deadlineMatch = task.description?.match(/\[Deadline: (.+?)\]/);
                const extractedDeadline = deadlineMatch ? deadlineMatch[1] : undefined;
                const cleanDescription = task.description?.replace(/\[Deadline: .+?\]/, '').trim();

                return {
                    id: task.id,
                    user_id: task.user_id,
                    title: task.title,
                    description: cleanDescription,
                    progress: task.progress,
                    deadline: extractedDeadline,
                    is_longer_task: task.is_longer_task,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                };
            }) as LongerTask[];

            set({ longerTasks, isLoading: false });
        } catch (error) {
            console.error('Error fetching longer tasks:', error);
            set({ isLoading: false });
        }
    },

    createLongerTask: async (taskData) => {
        try {
            // Store deadline in description since deadline field is TIME type (for daily tasks only)
            const descriptionWithDeadline = taskData.deadline
                ? `${taskData.description || ''}\n[Deadline: ${taskData.deadline}]`.trim()
                : taskData.description;

            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    user_id: taskData.user_id,
                    title: taskData.title,
                    description: descriptionWithDeadline,
                    deadline: null, // NULL for longer tasks (TIME field is for daily tasks)
                    is_longer_task: true,
                    progress: 0,
                    category: 'Long-term Goal',
                    category_color: 'primary',
                    estimated_hours: (taskData as any).estimatedHours || 1.0, // Use provided hours or default to 1.0
                    scheduled_date: new Date().toISOString().split('T')[0],
                    is_completed: false,
                }])
                .select()
                .single();

            if (error) throw error;

            // Extract deadline from description
            const deadlineMatch = data.description?.match(/\[Deadline: (.+?)\]/);
            const extractedDeadline = deadlineMatch ? deadlineMatch[1] : undefined;

            const newLongerTask: LongerTask = {
                id: data.id,
                user_id: data.user_id,
                title: data.title,
                description: data.description?.replace(/\[Deadline: .+?\]/, '').trim(),
                progress: data.progress,
                deadline: extractedDeadline,
                is_longer_task: data.is_longer_task,
                created_at: data.created_at,
                updated_at: data.updated_at,
            };

            set((state) => ({
                longerTasks: [newLongerTask, ...state.longerTasks],
            }));
        } catch (error) {
            console.error('Error creating longer task:', error);
            throw error;
        }
    },

    updateLongerTaskProgress: async (id: string, progress: number) => {
        try {
            // Cap progress at 100%
            const cappedProgress = Math.min(100, Math.max(0, progress));

            const { error } = await supabase
                .from('tasks')
                .update({
                    progress: cappedProgress,
                    is_completed: cappedProgress === 100,
                    completed_at: cappedProgress === 100 ? new Date().toISOString() : null,
                })
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                longerTasks: state.longerTasks.map((task) =>
                    task.id === id ? { ...task, progress: cappedProgress } : task
                ),
            }));
        } catch (error) {
            console.error('Error updating longer task progress:', error);
            throw error;
        }
    },

    updateLongerTask: async (id, updates) => {
        try {
            const dbUpdates: any = {};

            // Handle deadline in description
            if (updates.deadline !== undefined) {
                const { data: currentTask } = await supabase
                    .from('tasks')
                    .select('description')
                    .eq('id', id)
                    .single();

                let cleanDescription = currentTask?.description?.replace(/\[Deadline: .+?\]/, '').trim() || '';
                if (updates.description !== undefined) {
                    cleanDescription = updates.description;
                }

                dbUpdates.description = updates.deadline
                    ? `${cleanDescription}\n[Deadline: ${updates.deadline}]`.trim()
                    : cleanDescription;
            } else if (updates.description !== undefined) {
                dbUpdates.description = updates.description;
            }

            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;

            const { error } = await supabase
                .from('tasks')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            // Update local state
            set((state) => ({
                longerTasks: state.longerTasks.map((task) => {
                    if (task.id === id) {
                        return {
                            ...task,
                            ...(updates.title && { title: updates.title }),
                            ...(updates.description !== undefined && { description: updates.description }),
                            ...(updates.deadline !== undefined && { deadline: updates.deadline }),
                        };
                    }
                    return task;
                }),
            }));
        } catch (error) {
            console.error('Error updating longer task:', error);
            throw error;
        }
    },

    deleteLongerTask: async (id: string) => {
        try {
            // First, unlink all daily tasks linked to this longer task
            await supabase
                .from('tasks')
                .update({ long_task_id: null })
                .eq('long_task_id', id);

            // Then delete the longer task
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                longerTasks: state.longerTasks.filter((task) => task.id !== id),
            }));
        } catch (error) {
            console.error('Error deleting longer task:', error);
            throw error;
        }
    },
}));

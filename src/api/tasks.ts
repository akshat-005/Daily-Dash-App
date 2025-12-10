import { supabase } from '../lib/supabase';
import { Task } from '../../types';

export const fetchTasks = async (userId: string, date: string): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', date)
        .order('start_time', { ascending: true });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(task => ({
        id: task.id,
        user_id: task.user_id,
        title: task.title,
        category: task.category,
        categoryColor: task.category_color as any,
        progress: task.progress,
        startTime: task.start_time,
        endTime: task.end_time,
        scheduled_date: task.scheduled_date,
        isCompleted: task.is_completed,
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
    }));
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            user_id: task.user_id,
            title: task.title,
            category: task.category,
            category_color: task.categoryColor,
            progress: task.progress || 0,
            start_time: task.startTime,
            end_time: task.endTime,
            scheduled_date: task.scheduled_date,
            is_completed: task.isCompleted || false,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        category: data.category,
        categoryColor: data.category_color,
        progress: data.progress,
        startTime: data.start_time,
        endTime: data.end_time,
        scheduled_date: data.scheduled_date,
        isCompleted: data.is_completed,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
    };
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    const dbUpdates: any = {};

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.categoryColor !== undefined) dbUpdates.category_color = updates.categoryColor;
    if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.scheduled_date !== undefined) dbUpdates.scheduled_date = updates.scheduled_date;
    if (updates.isCompleted !== undefined) {
        dbUpdates.is_completed = updates.isCompleted;
        if (updates.isCompleted) {
            dbUpdates.completed_at = new Date().toISOString();
            dbUpdates.progress = 100;
        } else {
            dbUpdates.completed_at = null;
        }
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        category: data.category,
        categoryColor: data.category_color,
        progress: data.progress,
        startTime: data.start_time,
        endTime: data.end_time,
        scheduled_date: data.scheduled_date,
        isCompleted: data.is_completed,
        completed_at: data.completed_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
    };
};

export const deleteTask = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateProgress = async (id: string, progress: number): Promise<void> => {
    await updateTask(id, { progress });
};

export const toggleComplete = async (id: string, isCompleted: boolean): Promise<Task> => {
    return updateTask(id, { isCompleted });
};

import { supabase } from '../lib/supabase';
import { Task, CategoryColor } from '../../types';

export const fetchTasks = async (userId: string, date: string): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', date)
        .or('is_longer_task.eq.false,is_longer_task.is.null') // Exclude longer tasks
        .order('created_at', { ascending: true }); // Changed from start_time

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(task => ({
        id: task.id,
        user_id: task.user_id,
        title: task.title,
        category: task.category,
        categoryColor: task.category_color as CategoryColor, // Changed type assertion
        progress: task.progress,
        estimatedHours: task.estimated_hours, // Added
        deadline: task.deadline,             // Added
        // startTime and endTime removed
        scheduled_date: task.scheduled_date,
        isCompleted: task.is_completed,
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
    }));
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<Task> => { // Updated Omit type
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            user_id: task.user_id,
            title: task.title,
            category: task.category,
            category_color: task.categoryColor,
            progress: task.progress || 0,
            estimated_hours: task.estimatedHours, // Added
            deadline: task.deadline,             // Added
            // start_time and end_time removed
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
        categoryColor: data.category_color as CategoryColor, // Changed type assertion
        progress: data.progress,
        estimatedHours: data.estimated_hours, // Added
        deadline: data.deadline,             // Added
        // startTime and endTime removed
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
    if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
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
        categoryColor: data.category_color as CategoryColor,
        progress: data.progress,
        estimatedHours: data.estimated_hours,
        deadline: data.deadline,
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

import { supabase } from '../lib/supabase';
import { Category, CategoryColor } from '../../types';

export const fetchCategories = async (userId: string): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const createCategory = async (
    userId: string,
    name: string,
    color: CategoryColor
): Promise<Category> => {
    const { data, error } = await supabase
        .from('categories')
        .insert({
            user_id: userId,
            name,
            color,
        })
        .select()
        .single();

    if (error) {
        // If category already exists, fetch and return it
        if (error.code === '23505') {
            const { data: existing } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId)
                .eq('name', name)
                .single();

            if (existing) return existing;
        }
        throw error;
    }

    return data;
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

    if (error) throw error;
};

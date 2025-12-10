import { supabase } from '../lib/supabase';
import { Reflection } from '../../types';

export const fetchReflection = async (userId: string, date: string): Promise<Reflection | null> => {
    const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('reflection_date', date)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
    }

    return data;
};

export const saveReflection = async (reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>): Promise<Reflection> => {
    // Try to update first, if not exists, insert
    const { data: existing } = await supabase
        .from('reflections')
        .select('id')
        .eq('user_id', reflection.user_id)
        .eq('reflection_date', reflection.reflection_date)
        .single();

    if (existing) {
        // Update existing reflection
        const { data, error } = await supabase
            .from('reflections')
            .update({
                what_went_well: reflection.what_went_well,
                needs_improvement: reflection.needs_improvement,
                plan_tomorrow: reflection.plan_tomorrow,
            })
            .eq('id', existing.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        // Insert new reflection
        const { data, error } = await supabase
            .from('reflections')
            .insert({
                user_id: reflection.user_id,
                reflection_date: reflection.reflection_date,
                what_went_well: reflection.what_went_well,
                needs_improvement: reflection.needs_improvement,
                plan_tomorrow: reflection.plan_tomorrow,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

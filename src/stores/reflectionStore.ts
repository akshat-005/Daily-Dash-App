import { create } from 'zustand';
import { Reflection } from '../../types';
import * as reflectionApi from '../api/reflections';

interface ReflectionStore {
    reflection: Reflection | null;
    loading: boolean;
    error: string | null;

    fetchReflection: (userId: string, date: string) => Promise<void>;
    saveReflection: (reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    clearReflection: () => void;
}

export const useReflectionStore = create<ReflectionStore>((set) => ({
    reflection: null,
    loading: false,
    error: null,

    fetchReflection: async (userId, date) => {
        set({ loading: true, error: null });
        try {
            const reflection = await reflectionApi.fetchReflection(userId, date);
            set({ reflection, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    saveReflection: async (reflection) => {
        set({ loading: true, error: null });
        try {
            const savedReflection = await reflectionApi.saveReflection(reflection);
            set({ reflection: savedReflection, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    clearReflection: () => set({ reflection: null }),
}));

import { create } from 'zustand';
import { Category, CategoryColor } from '../../types';
import * as categoriesApi from '../api/categories';

interface CategoryStore {
    categories: Category[];
    loading: boolean;
    error: string | null;

    fetchCategories: (userId: string) => Promise<void>;
    createCategory: (userId: string, name: string, color: CategoryColor) => Promise<Category>;
    deleteCategory: (categoryId: string) => Promise<void>;
    getCategoryByName: (name: string) => Category | undefined;
    ensureCategoryExists: (userId: string, name: string, color: CategoryColor) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],
    loading: false,
    error: null,

    fetchCategories: async (userId) => {
        set({ loading: true, error: null });
        try {
            const categories = await categoriesApi.fetchCategories(userId);
            set({ categories, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createCategory: async (userId, name, color) => {
        try {
            const category = await categoriesApi.createCategory(userId, name, color);

            // Add to store if not already present
            const existing = get().categories.find(c => c.id === category.id);
            if (!existing) {
                set({ categories: [...get().categories, category] });
            }

            return category;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            await categoriesApi.deleteCategory(categoryId);
            set({ categories: get().categories.filter(c => c.id !== categoryId) });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    getCategoryByName: (name) => {
        return get().categories.find(c => c.name === name);
    },

    ensureCategoryExists: async (userId, name, color) => {
        const existing = get().getCategoryByName(name);
        if (!existing) {
            await get().createCategory(userId, name, color);
        }
    },
}));

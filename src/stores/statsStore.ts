import { create } from 'zustand';
import { DailyStats, Streak } from '../../types';
import * as statsApi from '../api/stats';

interface StatsStore {
    streak: Streak | null;
    dailyStats: DailyStats | null;
    weeklyMomentum: DailyStats[];
    loading: boolean;
    error: string | null;

    fetchStreak: (userId: string) => Promise<void>;
    fetchDailyStats: (userId: string, date: string) => Promise<void>;
    fetchWeeklyMomentum: (userId: string) => Promise<void>;
    updateStreak: (userId: string) => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
    streak: null,
    dailyStats: null,
    weeklyMomentum: [],
    loading: false,
    error: null,

    fetchStreak: async (userId) => {
        set({ loading: true, error: null });
        try {
            const streak = await statsApi.fetchStreak(userId);
            set({ streak, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchDailyStats: async (userId, date) => {
        set({ loading: true, error: null });
        try {
            const dailyStats = await statsApi.fetchDailyStats(userId, date);
            set({ dailyStats, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchWeeklyMomentum: async (userId) => {
        set({ loading: true, error: null });
        try {
            const weeklyMomentum = await statsApi.fetchWeeklyMomentum(userId);
            set({ weeklyMomentum, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateStreak: async (userId) => {
        try {
            const streak = await statsApi.updateStreak(userId);
            set({ streak });
        } catch (error: any) {
            set({ error: error.message });
        }
    },
}));

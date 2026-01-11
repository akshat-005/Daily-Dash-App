import { create } from 'zustand';
import { RevisitItem, CreateRevisitInput, DifficultyRating } from '../../types';
import * as revisitApi from '../api/revisits';
import { formatDate } from '../utils/dateUtils';

interface RevisitStore {
    // State
    revisits: RevisitItem[];
    todayRevisits: RevisitItem[];
    upcomingRevisits: RevisitItem[];
    loading: boolean;
    error: string | null;

    // Stats
    stats: {
        dueToday: number;
        totalActive: number;
        completedThisWeek: number;
        totalMinutesToday: number;
    };

    // Actions
    fetchRevisits: (userId: string) => Promise<void>;
    fetchTodayRevisits: (userId: string) => Promise<void>;
    fetchUpcomingRevisits: (userId: string) => Promise<void>;
    fetchStats: (userId: string) => Promise<void>;
    createRevisit: (input: CreateRevisitInput) => Promise<void>;
    updateRevisit: (id: string, updates: Partial<RevisitItem>) => Promise<void>;
    completeRevisit: (id: string, difficulty: DifficultyRating) => Promise<void>;
    snoozeRevisit: (id: string, days: number) => Promise<void>;
    archiveRevisit: (id: string) => Promise<void>;
    markDone: (id: string) => Promise<void>;
    deleteRevisit: (id: string) => Promise<void>;

    // Computed
    getTodayStats: () => { count: number; totalMinutes: number };
}

export const useRevisitStore = create<RevisitStore>((set, get) => ({
    revisits: [],
    todayRevisits: [],
    upcomingRevisits: [],
    loading: false,
    error: null,
    stats: {
        dueToday: 0,
        totalActive: 0,
        completedThisWeek: 0,
        totalMinutesToday: 0,
    },

    fetchRevisits: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const revisits = await revisitApi.fetchRevisits(userId);
            set({ revisits, loading: false });
        } catch (error) {
            console.error('Failed to fetch revisits:', error);
            set({ error: 'Failed to fetch revisits', loading: false });
        }
    },

    fetchTodayRevisits: async (userId: string) => {
        try {
            const today = formatDate(new Date());
            const todayRevisits = await revisitApi.fetchRevisitsDueOn(userId, today);
            set({ todayRevisits });
        } catch (error) {
            console.error('Failed to fetch today revisits:', error);
        }
    },

    fetchUpcomingRevisits: async (userId: string) => {
        try {
            const upcomingRevisits = await revisitApi.fetchUpcomingRevisits(userId, 7);
            set({ upcomingRevisits });
        } catch (error) {
            console.error('Failed to fetch upcoming revisits:', error);
        }
    },

    fetchStats: async (userId: string) => {
        try {
            const stats = await revisitApi.getRevisitStats(userId);
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch revisit stats:', error);
        }
    },

    createRevisit: async (input: CreateRevisitInput) => {
        set({ loading: true, error: null });
        try {
            const newRevisit = await revisitApi.createRevisit(input);
            set((state) => ({
                revisits: [...state.revisits, newRevisit],
                // Add to today if due today
                todayRevisits: newRevisit.next_review_at <= formatDate(new Date())
                    ? [...state.todayRevisits, newRevisit]
                    : state.todayRevisits,
                loading: false,
            }));
        } catch (error) {
            console.error('Failed to create revisit:', error);
            set({ error: 'Failed to create revisit', loading: false });
            throw error;
        }
    },

    updateRevisit: async (id: string, updates: Partial<RevisitItem>) => {
        try {
            const updated = await revisitApi.updateRevisit(id, updates);
            set((state) => ({
                revisits: state.revisits.map((r) => (r.id === id ? updated : r)),
                todayRevisits: state.todayRevisits.map((r) => (r.id === id ? updated : r)),
                upcomingRevisits: state.upcomingRevisits.map((r) => (r.id === id ? updated : r)),
            }));
        } catch (error) {
            console.error('Failed to update revisit:', error);
            throw error;
        }
    },

    completeRevisit: async (id: string, difficulty: DifficultyRating) => {
        const revisit = get().revisits.find((r) => r.id === id)
            || get().todayRevisits.find((r) => r.id === id);

        if (!revisit) return;

        try {
            const updated = await revisitApi.completeRevisit(id, difficulty, revisit.review_count);

            // Remove from today and add to upcoming based on new date
            set((state) => ({
                revisits: state.revisits.map((r) => (r.id === id ? updated : r)),
                todayRevisits: state.todayRevisits.filter((r) => r.id !== id),
                upcomingRevisits: [...state.upcomingRevisits, updated].sort(
                    (a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()
                ),
            }));
        } catch (error) {
            console.error('Failed to complete revisit:', error);
            throw error;
        }
    },

    snoozeRevisit: async (id: string, days: number) => {
        try {
            const updated = await revisitApi.snoozeRevisit(id, days);

            // Remove from today and potentially add to upcoming
            set((state) => ({
                revisits: state.revisits.map((r) => (r.id === id ? updated : r)),
                todayRevisits: state.todayRevisits.filter((r) => r.id !== id),
                upcomingRevisits: days <= 7
                    ? [...state.upcomingRevisits.filter((r) => r.id !== id), updated].sort(
                        (a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()
                    )
                    : state.upcomingRevisits.filter((r) => r.id !== id),
            }));
        } catch (error) {
            console.error('Failed to snooze revisit:', error);
            throw error;
        }
    },

    archiveRevisit: async (id: string) => {
        try {
            await revisitApi.archiveRevisit(id);
            set((state) => ({
                revisits: state.revisits.filter((r) => r.id !== id),
                todayRevisits: state.todayRevisits.filter((r) => r.id !== id),
                upcomingRevisits: state.upcomingRevisits.filter((r) => r.id !== id),
            }));
        } catch (error) {
            console.error('Failed to archive revisit:', error);
            throw error;
        }
    },

    markDone: async (id: string) => {
        try {
            await revisitApi.markRevisitDone(id);
            set((state) => ({
                revisits: state.revisits.filter((r) => r.id !== id),
                todayRevisits: state.todayRevisits.filter((r) => r.id !== id),
                upcomingRevisits: state.upcomingRevisits.filter((r) => r.id !== id),
            }));
        } catch (error) {
            console.error('Failed to mark revisit as done:', error);
            throw error;
        }
    },

    deleteRevisit: async (id: string) => {
        try {
            await revisitApi.deleteRevisit(id);
            set((state) => ({
                revisits: state.revisits.filter((r) => r.id !== id),
                todayRevisits: state.todayRevisits.filter((r) => r.id !== id),
                upcomingRevisits: state.upcomingRevisits.filter((r) => r.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete revisit:', error);
            throw error;
        }
    },

    getTodayStats: () => {
        const todayRevisits = get().todayRevisits;
        return {
            count: todayRevisits.length,
            totalMinutes: todayRevisits.reduce((sum, r) => sum + r.estimated_time_min, 0),
        };
    },
}));

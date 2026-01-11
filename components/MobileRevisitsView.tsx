import React, { useEffect, useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useRevisitStore } from '../src/stores/revisitStore';
import { DifficultyRating, CreateRevisitInput } from '../types';
import RevisitCard from '../src/components/RevisitCard';
import QuickCaptureModal from '../src/components/QuickCaptureModal';
import { formatDate } from '../src/utils/dateUtils';
import { formatEstimatedTime } from '../src/utils/spacedRepetition';
import toast from 'react-hot-toast';

interface MobileRevisitsViewProps {
    currentDate: Date;
}

const MobileRevisitsView: React.FC<MobileRevisitsViewProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all'>('today');

    const {
        todayRevisits,
        upcomingRevisits,
        revisits,
        loading,
        stats,
        fetchTodayRevisits,
        fetchUpcomingRevisits,
        fetchRevisits,
        fetchStats,
        createRevisit,
        completeRevisit,
        snoozeRevisit,
        deleteRevisit,
        markDone,
    } = useRevisitStore();

    useEffect(() => {
        if (user) {
            fetchTodayRevisits(user.id);
            fetchUpcomingRevisits(user.id);
            fetchRevisits(user.id);
            fetchStats(user.id);
        }
    }, [user, currentDate]);

    const handleCreateRevisit = async (input: CreateRevisitInput) => {
        try {
            await createRevisit(input);
            toast.success('📌 Revisit saved!');
            // Refresh data
            if (user) {
                fetchTodayRevisits(user.id);
                fetchStats(user.id);
            }
        } catch {
            toast.error('Failed to save revisit');
        }
    };

    const handleComplete = async (id: string, difficulty: DifficultyRating) => {
        try {
            await completeRevisit(id, difficulty);
            toast.success(
                difficulty === 'easy'
                    ? '🎉 Great! See you in 2 weeks'
                    : difficulty === 'medium'
                        ? '👍 Coming back in 1 week'
                        : '💪 Let\'s try again in 2 days'
            );
            if (user) fetchStats(user.id);
        } catch {
            toast.error('Failed to complete revisit');
        }
    };

    const handleSnooze = async (id: string, days: number) => {
        try {
            await snoozeRevisit(id, days);
            toast.success(`⏰ Snoozed for ${days} day${days > 1 ? 's' : ''}`);
        } catch {
            toast.error('Failed to snooze revisit');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteRevisit(id);
            toast.success('Revisit deleted');
        } catch {
            toast.error('Failed to delete revisit');
        }
    };

    const handleMarkDone = async (id: string) => {
        try {
            await markDone(id);
            toast.success('🎓 Mastered! Great job!');
            if (user) fetchStats(user.id);
        } catch {
            toast.error('Failed to mark as done');
        }
    };

    // Calculate backlog (overdue items)
    const today = formatDate(new Date());
    const backlogRevisits = revisits.filter(r => r.next_review_at < today);
    const allDueToday = [...backlogRevisits, ...todayRevisits];

    return (
        <div className="p-4 pb-24">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{stats.dueToday}</p>
                    <p className="text-white/50 text-xs">Due Today</p>
                </div>
                <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalActive}</p>
                    <p className="text-white/50 text-xs">Active</p>
                </div>
                <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.completedThisWeek}</p>
                    <p className="text-white/50 text-xs">This Week</p>
                </div>
            </div>

            {/* Quick Capture Button */}
            <button
                onClick={() => setIsQuickCaptureOpen(true)}
                className="w-full py-3 mb-4 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/20 border border-primary/30 text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary/30 transition-all"
            >
                <span className="material-symbols-outlined">add</span>
                Quick Capture
            </button>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${activeTab === 'today'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70'
                        }`}
                >
                    📌 Today
                    {allDueToday.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                            {allDueToday.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'upcoming'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70'
                        }`}
                >
                    📅 Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70'
                        }`}
                >
                    📚 All
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Today Tab */}
                    {activeTab === 'today' && (
                        <>
                            {allDueToday.length > 0 ? (
                                <>
                                    {/* Time estimate header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white/50 text-sm">
                                            {formatEstimatedTime(stats.totalMinutesToday)} total
                                        </span>
                                        {backlogRevisits.length > 0 && (
                                            <span className="text-amber-400 text-xs">
                                                ⚠️ {backlogRevisits.length} overdue
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {allDueToday.map((revisit) => (
                                            <RevisitCard
                                                key={revisit.id}
                                                revisit={revisit}
                                                onComplete={handleComplete}
                                                onSnooze={handleSnooze}
                                                onDelete={handleDelete}
                                                onMarkDone={handleMarkDone}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="text-5xl mb-4 block">🎉</span>
                                    <p className="text-white font-semibold text-lg mb-1">All caught up!</p>
                                    <p className="text-white/50 text-sm">No revisits due today</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Upcoming Tab */}
                    {activeTab === 'upcoming' && (
                        <>
                            {upcomingRevisits.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingRevisits.map((revisit) => (
                                        <RevisitCard
                                            key={revisit.id}
                                            revisit={revisit}
                                            onComplete={handleComplete}
                                            onSnooze={handleSnooze}
                                            onDelete={handleDelete}
                                            onMarkDone={handleMarkDone}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="text-5xl mb-4 block">📅</span>
                                    <p className="text-white font-semibold text-lg mb-1">Nothing upcoming</p>
                                    <p className="text-white/50 text-sm">
                                        Capture something to learn!
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* All Tab */}
                    {activeTab === 'all' && (
                        <>
                            {revisits.length > 0 ? (
                                <div className="space-y-3">
                                    {revisits.map((revisit) => (
                                        <RevisitCard
                                            key={revisit.id}
                                            revisit={revisit}
                                            onComplete={handleComplete}
                                            onSnooze={handleSnooze}
                                            onDelete={handleDelete}
                                            onMarkDone={handleMarkDone}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="text-5xl mb-4 block">📌</span>
                                    <p className="text-white font-semibold text-lg mb-1">Start your return stack</p>
                                    <p className="text-white/50 text-sm mb-4">
                                        Capture topics, resources, and concepts to revisit
                                    </p>
                                    <button
                                        onClick={() => setIsQuickCaptureOpen(true)}
                                        className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-sm"
                                    >
                                        + Quick Capture
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Quick Capture Modal */}
            <QuickCaptureModal
                isOpen={isQuickCaptureOpen}
                userId={user?.id || ''}
                onSave={handleCreateRevisit}
                onClose={() => setIsQuickCaptureOpen(false)}
            />
        </div>
    );
};

export default MobileRevisitsView;

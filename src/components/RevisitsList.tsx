import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRevisitStore } from '../stores/revisitStore';
import { RevisitItem, DifficultyRating, CreateRevisitInput } from '../../types';
import RevisitCard from './RevisitCard';
import QuickCaptureModal from './QuickCaptureModal';
import { formatDate } from '../utils/dateUtils';
import { formatEstimatedTime } from '../utils/spacedRepetition';
import toast from 'react-hot-toast';

interface RevisitsListProps {
    currentDate: Date;
}

const RevisitsList: React.FC<RevisitsListProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<'today' | 'upcoming' | 'all'>('today');

    const {
        todayRevisits,
        upcomingRevisits,
        revisits,
        loading,
        fetchTodayRevisits,
        fetchUpcomingRevisits,
        fetchRevisits,
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
        }
    }, [user, currentDate]);

    const handleCreateRevisit = async (input: CreateRevisitInput) => {
        try {
            await createRevisit(input);
            toast.success('Revisit saved!');
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
        } catch {
            toast.error('Failed to complete revisit');
        }
    };

    const handleSnooze = async (id: string, days: number) => {
        try {
            await snoozeRevisit(id, days);
            toast.success(`Snoozed for ${days} day${days > 1 ? 's' : ''}`);
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
        } catch {
            toast.error('Failed to mark as done');
        }
    };

    // Calculate backlog (overdue items)
    const today = formatDate(new Date());
    const backlogRevisits = revisits.filter(r => r.next_review_at < today);

    // Stats
    const todayTotalMinutes = todayRevisits.reduce((sum, r) => sum + r.estimated_time_min, 0);

    // Group upcoming by date
    const upcomingGrouped = upcomingRevisits.reduce((acc, revisit) => {
        const date = revisit.next_review_at;
        if (!acc[date]) acc[date] = [];
        acc[date].push(revisit);
        return acc;
    }, {} as Record<string, RevisitItem[]>);

    const formatGroupDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (dateStr === formatDate(tomorrow)) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-white text-lg font-bold flex items-center gap-2">
                        📌 Return Stack
                    </h2>
                    {todayRevisits.length > 0 && (
                        <p className="text-white/50 text-sm">
                            {todayRevisits.length} due today • {formatEstimatedTime(todayTotalMinutes)}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setIsQuickCaptureOpen(true)}
                    className="px-3 py-2 rounded-xl bg-primary text-black font-semibold text-sm hover:brightness-110 transition-all flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Quick Capture
                </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveSection('today')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'today'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70 hover:bg-[#2d4a38]'
                        }`}
                >
                    Today
                    {(todayRevisits.length + backlogRevisits.length) > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                            {todayRevisits.length + backlogRevisits.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSection('upcoming')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'upcoming'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70 hover:bg-[#2d4a38]'
                        }`}
                >
                    Upcoming
                    {upcomingRevisits.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                            {upcomingRevisits.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSection('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === 'all'
                            ? 'bg-primary text-black'
                            : 'bg-[#1a2d23] text-white/70 hover:bg-[#2d4a38]'
                        }`}
                >
                    All
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {/* Today Section */}
                        {activeSection === 'today' && (
                            <>
                                {/* Backlog Warning */}
                                {backlogRevisits.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-amber-400 text-sm font-medium">
                                                ⚠️ Overdue ({backlogRevisits.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {backlogRevisits.map((revisit) => (
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
                                    </div>
                                )}

                                {/* Today's Items */}
                                {todayRevisits.length > 0 ? (
                                    <div className="space-y-3">
                                        {todayRevisits.map((revisit) => (
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
                                ) : backlogRevisits.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-3 block">🎉</span>
                                        <p className="text-white/70 font-medium">All caught up!</p>
                                        <p className="text-white/40 text-sm">No revisits due today</p>
                                    </div>
                                ) : null}
                            </>
                        )}

                        {/* Upcoming Section */}
                        {activeSection === 'upcoming' && (
                            <>
                                {Object.keys(upcomingGrouped).length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(upcomingGrouped).map(([date, items]) => (
                                            <div key={date}>
                                                <h3 className="text-white/60 text-sm font-medium mb-2">
                                                    {formatGroupDate(date)}
                                                </h3>
                                                <div className="space-y-2">
                                                    {items.map((revisit) => (
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
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-3 block">📅</span>
                                        <p className="text-white/70 font-medium">No upcoming revisits</p>
                                        <p className="text-white/40 text-sm">Capture something to learn!</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* All Section */}
                        {activeSection === 'all' && (
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
                                        <span className="text-4xl mb-3 block">📌</span>
                                        <p className="text-white/70 font-medium">No revisits yet</p>
                                        <p className="text-white/40 text-sm">
                                            Start capturing topics to revisit
                                        </p>
                                        <button
                                            onClick={() => setIsQuickCaptureOpen(true)}
                                            className="mt-4 px-4 py-2 rounded-xl bg-primary text-black font-semibold text-sm hover:brightness-110 transition-all"
                                        >
                                            + Quick Capture
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

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

export default RevisitsList;

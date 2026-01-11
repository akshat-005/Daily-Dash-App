import React, { useEffect, useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useRevisitStore } from '../src/stores/revisitStore';
import { DifficultyRating, CreateRevisitInput, RevisitItem } from '../types';
import RevisitCard from '../src/components/RevisitCard';
import QuickCaptureModal from '../src/components/QuickCaptureModal';
import { formatDate } from '../src/utils/dateUtils';
import { formatEstimatedTime } from '../src/utils/spacedRepetition';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Helper to format dates for table display
const formatTableDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface DesktopRevisitsPageProps {
    currentDate: Date;
}

const DesktopRevisitsPage: React.FC<DesktopRevisitsPageProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all'>('today');
    const [rescheduleItem, setRescheduleItem] = useState<RevisitItem | null>(null);

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

    // Export revisits to Excel
    const handleExportToExcel = () => {
        const exportData = revisits.map((r, index) => ({
            'S.No.': index + 1,
            'Title': r.title,
            'URL': r.resource_url || '',
            'Reason': r.reason_to_return || '',
            'Type': r.type || 'topic',
            'Status': r.status,
            'Next Review': formatTableDate(r.next_review_at),
            'Review Count': r.review_count,
            'Est. Time (min)': r.estimated_time_min,
            'Difficulty': r.difficulty || '',
            'Notes': r.notes || '',
            'Created': formatTableDate(r.created_at),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Revisits');

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row => String((row as Record<string, unknown>)[key] || '').length)))
        }));
        worksheet['!cols'] = colWidths;

        // Generate filename with date
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `DailyDash_Revisits_${dateStr}.xlsx`);
        toast.success('📥 Exported to Excel!');
    };

    // Reschedule a revisit (reactivate and set new review date)
    const handleReschedule = async (id: string, nextReviewAt: string) => {
        try {
            // Update the revisit with new date and reactivate
            const { updateRevisit } = await import('../src/api/revisits');
            await updateRevisit(id, {
                next_review_at: nextReviewAt,
                status: 'active',
            });
            toast.success('📅 Revisit rescheduled!');
            setRescheduleItem(null);
            if (user) {
                fetchRevisits(user.id);
                fetchTodayRevisits(user.id);
                fetchUpcomingRevisits(user.id);
                fetchStats(user.id);
            }
        } catch {
            toast.error('Failed to reschedule');
        }
    };

    // Calculate backlog (overdue items)
    const today = formatDate(new Date());
    const backlogRevisits = revisits.filter(r => r.next_review_at < today);
    const allDueToday = [...backlogRevisits, ...todayRevisits];

    // Group upcoming by date
    const upcomingGrouped = upcomingRevisits.reduce((acc, revisit) => {
        const date = revisit.next_review_at;
        if (!acc[date]) acc[date] = [];
        acc[date].push(revisit);
        return acc;
    }, {} as Record<string, RevisitItem[]>);

    const formatGroupDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (dateStr === formatDate(tomorrow)) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-white text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">📌</span>
                        Return Stack
                    </h1>
                    <p className="text-white/50 mt-1">Spaced repetition for real-life learning</p>
                </div>
                <button
                    onClick={() => setIsQuickCaptureOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-glow"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Quick Capture
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-400 text-[20px]">priority_high</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.dueToday}</p>
                            <p className="text-white/50 text-xs">Due Today</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{formatEstimatedTime(stats.totalMinutesToday)}</p>
                            <p className="text-white/50 text-xs">Time Today</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">bookmark</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.totalActive}</p>
                            <p className="text-white/50 text-xs">Active Items</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.completedThisWeek}</p>
                            <p className="text-white/50 text-xs">This Week</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-surface-border pb-4">
                <button
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'today'
                        ? 'bg-primary text-black'
                        : 'bg-surface-dark text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                >
                    📌 Due Today
                    {allDueToday.length > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'today' ? 'bg-black/20' : 'bg-primary/20 text-primary'
                            }`}>
                            {allDueToday.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'upcoming'
                        ? 'bg-primary text-black'
                        : 'bg-surface-dark text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                >
                    📅 Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'all'
                        ? 'bg-primary text-black'
                        : 'bg-surface-dark text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                >
                    📚 All Items
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Today Tab */}
                    {activeTab === 'today' && (
                        <>
                            {allDueToday.length > 0 ? (
                                <>
                                    {backlogRevisits.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-amber-400 font-semibold text-sm mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">warning</span>
                                                Overdue ({backlogRevisits.length})
                                            </h3>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <span className="text-6xl mb-4 block">🎉</span>
                                    <h3 className="text-white font-bold text-xl mb-2">All caught up!</h3>
                                    <p className="text-white/50 mb-6">No revisits due today. Nice work!</p>
                                    <button
                                        onClick={() => setIsQuickCaptureOpen(true)}
                                        className="px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white hover:border-primary/50 transition-colors"
                                    >
                                        + Capture something new
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Upcoming Tab - Card Style */}
                    {activeTab === 'upcoming' && (
                        <>
                            {Object.keys(upcomingGrouped).length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(upcomingGrouped).map(([date, items]) => (
                                        <div key={date}>
                                            {/* Date Header */}
                                            <h3 className="text-white/60 font-semibold text-sm mb-3">
                                                {formatGroupDate(date)}
                                            </h3>

                                            {/* Cards Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                {items.map((revisit) => (
                                                    <div
                                                        key={revisit.id}
                                                        className="bg-surface-dark border border-surface-border hover:border-primary/40 rounded-xl p-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5"
                                                        onClick={() => setRescheduleItem(revisit)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Type Icon */}
                                                            <div className="size-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                                                                <span className="text-lg">
                                                                    {revisit.type === 'tech' ? '💻' :
                                                                        revisit.type === 'leetcode' ? '🧩' :
                                                                            revisit.type === 'math' ? '📐' :
                                                                                revisit.type === 'college' ? '🎓' :
                                                                                    revisit.type === 'book' ? '📚' : '📌'}
                                                                </span>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-white font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 leading-tight mb-1">
                                                                    {revisit.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-white/40">
                                                                        {revisit.estimated_time_min}m
                                                                    </span>
                                                                    {revisit.review_count > 0 && (
                                                                        <span className="text-[10px] text-white/30">
                                                                            • Reviewed {revisit.review_count}x
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Hover arrow */}
                                                            <span className="material-symbols-outlined text-primary/50 text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                                arrow_forward
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <span className="text-6xl mb-4 block">📅</span>
                                    <h3 className="text-white font-bold text-xl mb-2">Nothing upcoming</h3>
                                    <p className="text-white/50 mb-6">Capture something to learn!</p>
                                    <button
                                        onClick={() => setIsQuickCaptureOpen(true)}
                                        className="px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white hover:border-primary/50 transition-colors"
                                    >
                                        + Quick Capture
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* All Tab - Table View */}
                    {activeTab === 'all' && (
                        <>
                            {revisits.length > 0 ? (
                                <div className="bg-surface-dark border border-surface-border rounded-xl overflow-hidden">
                                    {/* Table Header with Export */}
                                    <div className="flex items-center justify-between p-4 border-b border-surface-border">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[18px]">table_chart</span>
                                            <span className="text-white font-semibold">All Revisits ({revisits.length})</span>
                                        </div>
                                        <button
                                            onClick={handleExportToExcel}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                            Export XLS
                                        </button>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[#111814] text-left">
                                                <tr>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">#</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Title</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Type</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Status</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Next Review</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Reviews</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Time Est.</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Created</th>
                                                    <th className="py-3 px-4 text-white/50 font-medium text-xs">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-border">
                                                {revisits.map((revisit, index) => {
                                                    const isOverdue = revisit.next_review_at < today && revisit.status === 'active';
                                                    const isDueToday = revisit.next_review_at === today;

                                                    return (
                                                        <tr
                                                            key={revisit.id}
                                                            className="hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-white/40">{index + 1}</td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-white font-medium truncate max-w-[200px]">{revisit.title}</span>
                                                                    {revisit.resource_url && (
                                                                        <a
                                                                            href={revisit.resource_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary/60 text-xs hover:underline truncate max-w-[200px]"
                                                                        >
                                                                            {revisit.resource_url}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 capitalize">
                                                                    {revisit.type || 'topic'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${revisit.status === 'done'
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : revisit.status === 'archived'
                                                                        ? 'bg-white/10 text-white/40'
                                                                        : isOverdue
                                                                            ? 'bg-red-500/20 text-red-400'
                                                                            : 'bg-primary/20 text-primary'
                                                                    }`}>
                                                                    {isOverdue ? 'overdue' : revisit.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`text-xs ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-white/60'
                                                                    }`}>
                                                                    {formatTableDate(revisit.next_review_at)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-white/60">{revisit.review_count}</td>
                                                            <td className="py-3 px-4 text-white/60">{revisit.estimated_time_min}m</td>
                                                            <td className="py-3 px-4 text-white/40 text-xs">
                                                                {formatTableDate(revisit.created_at)}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-1">
                                                                    {revisit.status === 'active' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleMarkDone(revisit.id)}
                                                                                className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                                                                                title="Mark as mastered"
                                                                            >
                                                                                <span className="material-symbols-outlined text-emerald-400 text-[14px]">check</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleSnooze(revisit.id, 1)}
                                                                                className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                                                                                title="Snooze 1 day"
                                                                            >
                                                                                <span className="material-symbols-outlined text-amber-400 text-[14px]">schedule</span>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {(revisit.status === 'done' || revisit.status === 'archived') && (
                                                                        <button
                                                                            onClick={() => setRescheduleItem(revisit)}
                                                                            className="size-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                                                                            title="Revisit Again"
                                                                        >
                                                                            <span className="material-symbols-outlined text-primary text-[14px]">replay</span>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDelete(revisit.id)}
                                                                        className="size-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <span className="material-symbols-outlined text-red-400 text-[14px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <span className="text-6xl mb-4 block">📌</span>
                                    <h3 className="text-white font-bold text-xl mb-2">Start your return stack</h3>
                                    <p className="text-white/50 mb-6">Capture topics, resources, and concepts to revisit</p>
                                    <button
                                        onClick={() => setIsQuickCaptureOpen(true)}
                                        className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold hover:brightness-110 transition-all"
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

            {/* Reschedule Modal */}
            <QuickCaptureModal
                isOpen={!!rescheduleItem}
                userId={user?.id || ''}
                editItem={rescheduleItem}
                onSave={handleCreateRevisit}
                onReschedule={handleReschedule}
                onClose={() => setRescheduleItem(null)}
            />
        </div>
    );
};

export default DesktopRevisitsPage;

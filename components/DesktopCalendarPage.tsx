import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import { useRevisitStore } from '../src/stores/revisitStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import { supabase } from '../src/lib/supabase';
import { formatDate, formatDisplayDate } from '../src/utils/dateUtils';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, addMonths, subMonths } from 'date-fns';
import { Day } from '../types';
import TaskModal from '../src/components/TaskModal';
import QuickCaptureModal from '../src/components/QuickCaptureModal';
import toast from 'react-hot-toast';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DesktopCalendarPageProps {
    currentDate: Date;
}

const DesktopCalendarPage: React.FC<DesktopCalendarPageProps> = ({ currentDate: initialDate }) => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [viewDate, setViewDate] = useState(initialDate); // For month navigation
    const [calendarDays, setCalendarDays] = useState<Day[]>([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showRevisitModal, setShowRevisitModal] = useState(false);

    const tasks = useTaskStore((state) => state.tasks);
    const fetchTasks = useTaskStore((state) => state.fetchTasks);
    const createTask = useTaskStore((state) => state.createTask);
    const calendarRevisits = useRevisitStore((state) => state.calendarRevisits);
    const fetchCalendarRevisits = useRevisitStore((state) => state.fetchCalendarRevisits);
    const categories = useCategoryStore((state) => state.categories);
    const fetchCategories = useCategoryStore((state) => state.fetchCategories);

    useEffect(() => {
        if (user) {
            loadCalendarData();
            loadDayData();
            fetchCategories(user.id);
        }
    }, [user, viewDate, selectedDate]);

    const loadCalendarData = async () => {
        if (!user) return;

        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Fetch daily stats for the month
        const { data: stats } = await supabase
            .from('daily_stats')
            .select('stat_date, productivity_level')
            .eq('user_id', user.id)
            .gte('stat_date', formatDate(monthStart))
            .lte('stat_date', formatDate(monthEnd));

        const statsMap = new Map(
            (stats || []).map((s) => [s.stat_date, s.productivity_level])
        );

        // Add empty days at the start to align with the calendar
        const firstDayOfWeek = getDay(monthStart);
        const emptyDays: Day[] = Array(firstDayOfWeek).fill(null).map(() => ({
            day: 0,
            status: 'none',
            isToday: false,
        }));

        const today = new Date();
        const monthDays: Day[] = daysInMonth.map((date) => {
            const dateStr = formatDate(date);
            const productivity = statsMap.get(dateStr);
            const isFuture = date > today;

            return {
                day: date.getDate(),
                date: date,
                status: isFuture
                    ? 'future'
                    : productivity === 'high'
                        ? 'high'
                        : productivity === 'medium'
                            ? 'medium'
                            : productivity === 'low'
                                ? 'low'
                                : 'none',
                isToday: formatDate(date) === formatDate(today),
            } as Day;
        });

        setCalendarDays([...emptyDays, ...monthDays]);
    };

    const loadDayData = () => {
        if (!user) return;
        const dateStr = formatDate(selectedDate);
        fetchTasks(user.id, dateStr);
        fetchCalendarRevisits(user.id, dateStr);
    };

    const handlePreviousMonth = () => {
        setViewDate(subMonths(viewDate, 1));
    };

    const handleNextMonth = () => {
        setViewDate(addMonths(viewDate, 1));
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    // Since we fetch data specifically for the selected date, we can just use the store data directly
    const selectedDayTasks = tasks;
    const selectedDayRevisits = calendarRevisits;

    return (
        <>
            <header className="flex items-center justify-between border-b border-surface-border px-6 py-4 sticky top-0 z-50 bg-[#111814]/90 backdrop-blur-md">
                <h1 className="text-white text-2xl font-bold">📅 Calendar</h1>
            </header>

            <main className="p-6 max-w-[1400px] mx-auto h-[calc(100vh-80px)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Left Column: Calendar (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col h-full bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-card overflow-hidden">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-white text-xl font-bold">
                                {format(viewDate, 'MMMM yyyy')}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePreviousMonth}
                                    className="size-8 rounded-lg bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setViewDate(new Date());
                                        setSelectedDate(new Date());
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-medium text-xs hover:bg-primary/30 transition-colors"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={handleNextMonth}
                                    className="size-8 rounded-lg bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex-1 grid grid-cols-7 gap-2 min-h-0">
                            {/* Day Headers */}
                            {daysOfWeek.map((day) => (
                                <div key={day} className="text-center text-xs font-bold text-[#9db9a8] py-1 self-end">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar Days */}
                            {calendarDays.map((d, i) => {
                                if (d.day === 0) return <div key={i}></div>;

                                const isSelected = d.date && formatDate(d.date) === formatDate(selectedDate);
                                const isToday = d.isToday;

                                let bgColor = 'bg-surface-border/20';
                                if (d.status === 'high') bgColor = 'bg-primary/20';
                                if (d.status === 'medium') bgColor = 'bg-yellow-400/20';
                                if (d.status === 'low') bgColor = 'bg-red-400/20';

                                return (
                                    <div
                                        key={i}
                                        onClick={() => d.date && handleDateSelect(d.date)}
                                        className={`
                                            rounded-lg p-1.5 cursor-pointer transition-all relative flex flex-col
                                            ${bgColor}
                                            ${isSelected ? 'ring-2 ring-primary bg-primary/30' : 'hover:bg-white/5'}
                                            ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}
                                            ${d.status === 'future' ? 'opacity-50' : ''}
                                        `}
                                    >
                                        <div className="text-white font-bold text-xs">{d.day}</div>
                                        {/* Optional: Add tiny dots for tasks/revisits count here if desired */}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Details (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col h-full bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-card overflow-hidden">

                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-white text-xl font-bold">
                                {formatDisplayDate(selectedDate)}
                            </h3>
                            {/* Quick Add Buttons (Compact) */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                                    title="Add Task"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                                </button>
                                <button
                                    onClick={() => setShowRevisitModal(true)}
                                    className="size-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                                    title="Add Revisit"
                                >
                                    <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Tasks Section */}
                            <div>
                                <h4 className="text-white/70 font-semibold text-sm mb-3 flex items-center gap-2 sticky top-0 bg-surface-dark py-1 z-10">
                                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                                    Tasks ({selectedDayTasks.length})
                                </h4>
                                {selectedDayTasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedDayTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="bg-[#111814] border border-surface-border rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-colors"
                                            >
                                                <div
                                                    className="size-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: task.categoryColor }}
                                                ></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">{task.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-white/40 text-[10px] uppercase tracking-wider">{task.category}</span>
                                                        {task.deadline && (
                                                            <span className="text-white/40 text-[10px] flex items-center gap-0.5">
                                                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                                {task.deadline}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {task.isCompleted ? (
                                                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-white/20 text-[18px]">radio_button_unchecked</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-surface-border rounded-xl">
                                        <p className="text-white/40 text-sm">No tasks scheduled</p>
                                        <button
                                            onClick={() => setShowTaskModal(true)}
                                            className="text-primary text-xs mt-1 hover:underline"
                                        >
                                            + Add one now
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Revisits Section */}
                            <div>
                                <h4 className="text-white/70 font-semibold text-sm mb-3 flex items-center gap-2 sticky top-0 bg-surface-dark py-1 z-10">
                                    <span className="material-symbols-outlined text-[18px]">replay</span>
                                    Revisits ({selectedDayRevisits.length})
                                </h4>
                                {selectedDayRevisits.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedDayRevisits.map((revisit) => (
                                            <div
                                                key={revisit.id}
                                                className="bg-[#111814] border border-surface-border rounded-xl p-3 hover:border-blue-500/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-white font-medium text-sm line-clamp-2">{revisit.title}</p>
                                                        <p className="text-white/50 text-xs mt-0.5">{revisit.type}</p>
                                                    </div>
                                                    <span className="px-1.5 py-0.5 rounded bg-surface-border text-white/60 text-[10px]">
                                                        {new Date(revisit.next_review_at).getDate()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/40 text-sm italic ml-1">No revisits due</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                userId={user?.id || ''}
                currentDate={selectedDate}
                existingCategories={categories}
                onSave={async (taskData) => {
                    if (user) {
                        try {
                            await createTask(taskData);
                            toast.success('Task created successfully');
                            loadDayData();
                        } catch (error) {
                            toast.error('Failed to create task');
                            console.error(error);
                        }
                    }
                }}
            />

            <QuickCaptureModal
                isOpen={showRevisitModal}
                userId={user?.id || ''}
                onSave={async () => {
                    toast.success('📌 Revisit saved!');
                    setShowRevisitModal(false);
                    loadDayData();
                }}
                onClose={() => setShowRevisitModal(false)}
            />
        </>
    );
};

export default DesktopCalendarPage;

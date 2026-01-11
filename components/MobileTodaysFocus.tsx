import React, { useState, useEffect, useRef } from 'react';
import { Task, DifficultyRating, CreateRevisitInput } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import { useLongerTaskStore } from '../src/stores/longerTaskStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import { useRevisitStore } from '../src/stores/revisitStore';
import TaskModal from '../src/components/TaskModal';
import PushToLaterDialog from '../src/components/PushToLaterDialog';
import ConfirmDialog from '../src/components/ConfirmDialog';
import AddLongerTaskModal from '../src/components/AddLongerTaskModal';
import TimerDurationModal from '../src/components/TimerDurationModal';
import RevisitCard from '../src/components/RevisitCard';
import QuickCaptureModal from '../src/components/QuickCaptureModal';
import toast from 'react-hot-toast';
import { formatDate, formatDeadlineTime, addDays } from '../src/utils/dateUtils';
import { formatTimeSpent, formatTimeDifference, isOverEstimate } from '../src/utils/timeUtils';
import { formatEstimatedTime } from '../src/utils/spacedRepetition';
import { useTimerSync } from '../src/hooks/useTimerSync';

interface MobileTodaysFocusProps {
    currentDate: Date;
}

const MobileTodaysFocus: React.FC<MobileTodaysFocusProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const tasks = useTaskStore((state) => state.tasks);
    const filter = useTaskStore((state) => state.filter);
    const setFilter = useTaskStore((state) => state.setFilter);
    const toggleComplete = useTaskStore((state) => state.toggleComplete);
    const updateTask = useTaskStore((state) => state.updateTask);
    const updateProgress = useTaskStore((state) => state.updateProgress);
    const deleteTask = useTaskStore((state) => state.deleteTask);
    const longerTasks = useLongerTaskStore((state) => state.longerTasks);
    const createLongerTask = useLongerTaskStore((state) => state.createLongerTask);
    const categories = useCategoryStore((state) => state.categories);

    // Revisit store
    const todayRevisits = useRevisitStore((state) => state.todayRevisits);
    const fetchTodayRevisits = useRevisitStore((state) => state.fetchTodayRevisits);
    const completeRevisit = useRevisitStore((state) => state.completeRevisit);
    const snoozeRevisit = useRevisitStore((state) => state.snoozeRevisit);
    const createRevisit = useRevisitStore((state) => state.createRevisit);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLongerTaskModalOpen, setIsLongerTaskModalOpen] = useState(false);
    const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
    const [pendingLinkTaskId, setPendingLinkTaskId] = useState<string | null>(null);
    const [pendingTimerTaskId, setPendingTimerTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [pushToLater, setPushToLater] = useState<{ isOpen: boolean; task: Task | null }>({
        isOpen: false,
        task: null,
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });
    const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
    const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Fetch today's revisits
    useEffect(() => {
        if (user) {
            fetchTodayRevisits(user.id);
        }
    }, [user, currentDate]);

    // Use timer sync hook for real-time synchronization
    const { activeTimers, startTimer, stopTimer, toggleTimer } = useTimerSync(user!.id, currentDate);

    // Auto-expand tasks with active timers
    useEffect(() => {
        const newExpandedIds = new Set(expandedTaskIds);
        let hasChanges = false;

        Object.keys(activeTimers).forEach(taskId => {
            if (!newExpandedIds.has(taskId)) {
                newExpandedIds.add(taskId);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            setExpandedTaskIds(newExpandedIds);
        }
    }, [activeTimers]);

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const clickedTaskId = Array.from(taskRefs.current.entries()).find(([_, ref]) =>
                ref?.contains(event.target as Node)
            )?.[0];

            if (!clickedTaskId) {
                // Clicked outside all tasks - collapse all except those with active timers
                const newExpandedIds = new Set<string>();
                Object.keys(activeTimers).forEach(taskId => newExpandedIds.add(taskId));
                setExpandedTaskIds(newExpandedIds);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeTimers]);

    // Timer countdown is now handled by useTimerSync hook

    const handleToggleComplete = async (id: string, isCompleted: boolean) => {
        try {
            await toggleComplete(id, !isCompleted);
            toast.success(isCompleted ? 'Task reopened' : 'Task completed! 🎉');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleProgressChange = async (id: string, newProgress: number) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        // Update progress only
        updateProgress(id, newProgress);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDeleteTask = (taskId: string) => {
        setDeleteConfirm({ isOpen: true, taskId });
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (deleteConfirm.taskId) {
            try {
                await deleteTask(deleteConfirm.taskId);
                toast.success('Task deleted');
            } catch (error) {
                toast.error('Failed to delete task');
            }
        }
        setDeleteConfirm({ isOpen: false, taskId: null });
    };

    const handlePushToLater = async (newDate: Date) => {
        if (!pushToLater.task) return;

        try {
            await updateTask(pushToLater.task.id, {
                scheduled_date: formatDate(newDate),
            });
            toast.success(`Task moved to ${newDate.toLocaleDateString()} `);
            setPushToLater({ isOpen: false, task: null });
        } catch (error) {
            toast.error('Failed to reschedule task');
        }
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editingTask) {
                await updateTask(editingTask.id, taskData);
                toast.success('Task updated');
            }
        } catch (error) {
            toast.error('Failed to save task');
        }
    };

    const handleStartTimer = async (taskId: string, customMinutes: number) => {
        try {
            await startTimer(taskId, customMinutes);
        } catch (error) {
            // Error already handled in hook
        }
    };

    const handleStopTimer = async (taskId: string) => {
        try {
            await stopTimer(taskId);
            // Refresh tasks to get updated time_spent
            await useTaskStore.getState().fetchTasks(user!.id, formatDate(currentDate));
        } catch (error) {
            // Error already handled in hook
        }
    };

    const handleToggleTimer = async (taskId: string) => {
        try {
            await toggleTimer(taskId);
        } catch (error) {
            // Error already handled in hook
        }
    };

    const handleLinkToLongerTask = async (taskId: string, longerTaskId: string | null) => {
        try {
            const { linkToLongerTask } = useTaskStore.getState();
            await linkToLongerTask(taskId, longerTaskId);
            if (longerTaskId) {
                toast.success('Task linked to longer task!');
            } else {
                toast.success('Task unlinked');
            }
        } catch (error) {
            toast.error('Failed to link task');
        }
    };

    const handleCreateAndLinkLongerTask = async (taskData: { user_id: string; title: string; description?: string; deadline?: string; estimatedHours?: number }) => {
        try {
            await createLongerTask(taskData);
            // Get the newly created task ID from the store
            const newLongerTasks = useLongerTaskStore.getState().longerTasks;
            const newLongerTask = newLongerTasks[newLongerTasks.length - 1];
            if (pendingLinkTaskId && newLongerTask) {
                await handleLinkToLongerTask(pendingLinkTaskId, newLongerTask.id);
            }
            setPendingLinkTaskId(null);
        } catch (error) {
            toast.error('Failed to create longer task');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')} `;
    };

    const getColorClasses = (color: string) => {
        const map: Record<string, string> = {
            indigo: 'bg-indigo-500/20 text-indigo-300',
            primary: 'bg-primary/20 text-primary',
            emerald: 'bg-emerald-500/20 text-emerald-400',
            purple: 'bg-purple-500/20 text-purple-300',
            pink: 'bg-pink-500/20 text-pink-300',
        };
        return map[color] || 'bg-gray-500/20 text-gray-300';
    };

    const getIconBgColor = (color: string) => {
        const map: Record<string, string> = {
            indigo: 'bg-indigo-500/30',
            primary: 'bg-primary/30',
            emerald: 'bg-emerald-500/30',
            purple: 'bg-purple-500/30',
            pink: 'bg-pink-500/30',
        };
        return map[color] || 'bg-gray-500/30';
    };

    const getGradient = (color: string) => {
        if (color === 'indigo') return 'bg-gradient-to-r from-blue-500 to-indigo-500';
        const map: Record<string, string> = {
            primary: 'bg-primary',
            emerald: 'bg-emerald-500',
            purple: 'bg-purple-500',
            pink: 'bg-pink-500',
        };
        return map[color] || 'bg-gray-500';
    };

    // Dynamically get unique categories from tasks
    const uniqueCategories = ['All Tasks', ...Array.from(new Set(tasks.map(task => task.category)))];

    // Filter tasks based on selected filter
    const filteredTasks = tasks.filter((task) => {
        if (filter === 'All Tasks') return true;
        return task.category === filter;
    });

    // Toggle task expansion
    const toggleTaskExpansion = (taskId: string) => {
        const newExpandedIds = new Set(expandedTaskIds);
        if (newExpandedIds.has(taskId)) {
            // Don't collapse if timer is active
            if (!activeTimers[taskId]) {
                newExpandedIds.delete(taskId);
            }
        } else {
            newExpandedIds.add(taskId);
        }
        setExpandedTaskIds(newExpandedIds);
    };

    // Circular Progress Component
    const CircularProgress = ({ value, color }: { value: number, color: string }) => {
        const getColor = (c: string) => {
            if (c === 'primary') return '#4ade80';
            if (c === 'indigo') return '#818cf8';
            if (c === 'emerald') return '#22c55e';
            if (c === 'purple') return '#c084fc';
            if (c === 'pink') return '#f472b6';
            return '#9ca3af';
        };

        return (
            <div className="relative flex items-center justify-center size-12">
                <svg className="transform -rotate-90 size-full" viewBox="0 0 36 36">
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-white/5"
                    />
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={getColor(color)}
                        strokeWidth="4"
                        strokeDasharray="100, 100"
                        strokeDashoffset={100 - value}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
                    {Math.round(value)}%
                </div>
            </div>
        );
    };

    return (
        <div className="px-4 py-3">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueCategories.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === f
                            ? 'bg-primary text-[#111814]'
                            : 'bg-[#1a2d23] border border-[#2d4a38] text-white font-medium hover:bg-[#2d4a38]'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-bold">Today's Focus</h2>
            </div>

            <div className="flex flex-col gap-3">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                        <p>No tasks for today</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const hasTimer = activeTimers[task.id];
                        const isCompleted = task.isCompleted;
                        const isMenuOpen = openMenuId === task.id;
                        const isExpanded = expandedTaskIds.has(task.id);

                        return (
                            <div
                                key={task.id}
                                ref={(el) => {
                                    if (el) taskRefs.current.set(task.id, el);
                                    else taskRefs.current.delete(task.id);
                                }}
                                onClick={() => !isExpanded && toggleTaskExpansion(task.id)}
                                className={`bg-[#1a2d23] border border-[#2d4a38] rounded-2xl shadow-card transition-all duration-300 ${isCompleted ? 'opacity-70' : ''
                                    } ${isExpanded
                                        ? 'p-4 ring-1 ring-primary/30'
                                        : 'p-3 active:scale-[0.98] cursor-pointer'
                                    }`}
                            >
                                {/* Header - Always Visible */}
                                <div className={`flex ${isExpanded ? 'justify-between items-start' : 'items-center gap-3'}`}>

                                    {/* Left: Progress Ring (Compact Only) */}
                                    {!isExpanded && !isCompleted && (
                                        <div className="shrink-0">
                                            <CircularProgress value={task.progress} color={task.categoryColor} />
                                        </div>
                                    )}

                                    {/* Center: Task Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getColorClasses(task.categoryColor)}`}>
                                                {task.category}
                                            </span>
                                        </div>
                                        <h3 className={`font-bold text-white ${isExpanded ? 'text-base' : 'text-sm'} ${isCompleted ? 'line-through' : ''} truncate`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                                            <span>{task.estimatedHours}h</span>
                                            {task.deadline && (
                                                <span>• Due {formatDeadlineTime(task.deadline)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Completion Toggle (Compact) or Menu (Expanded) */}
                                    {!isExpanded ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleComplete(task.id, task.isCompleted);
                                            }}
                                            className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isCompleted
                                                    ? 'bg-primary text-black'
                                                    : 'border-2 border-white/30 text-transparent hover:border-primary'
                                                }`}
                                        >
                                            {isCompleted && <span className="material-symbols-outlined text-[18px] font-bold">check</span>}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(isMenuOpen ? null : task.id);
                                                    }}
                                                    className="size-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>

                                                {isMenuOpen && (
                                                    <div className="absolute right-0 top-10 bg-[#111814] border border-[#2d4a38] rounded-xl shadow-lg overflow-hidden z-10 min-w-[160px]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditTask(task);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1a2d23] transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            Edit Task
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPushToLater({ isOpen: true, task });
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1a2d23] transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">schedule_send</span>
                                                            Push to Later
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task.id);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            Delete Task
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleComplete(task.id, task.isCompleted);
                                                }}
                                                className={`size-8 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                        ? 'bg-primary text-black'
                                                        : 'border-2 border-white/30 text-transparent hover:border-primary'
                                                    }`}
                                            >
                                                {isCompleted && <span className="material-symbols-outlined text-[18px] font-bold">check</span>}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="mt-3 space-y-3 animate-fade-in">
                                        {/* Time Spent Info */}
                                        {task.time_spent !== undefined && task.time_spent > 0 && (
                                            <div className="text-xs text-white/60">
                                                {isCompleted ? (
                                                    <>
                                                        Actual: {formatTimeSpent(task.time_spent)}
                                                        {task.time_spent !== task.estimatedHours && (
                                                            <span className={isOverEstimate(task.time_spent, task.estimatedHours) ? ' text-orange-400' : ' text-primary'}>
                                                                {' '}({formatTimeDifference(task.time_spent, task.estimatedHours)})
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        Time spent: {formatTimeSpent(task.time_spent)}
                                                        {task.time_spent > task.estimatedHours && (
                                                            <span className="text-orange-400"> (over)</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Progress Slider */}
                                        {!isCompleted && (
                                            <div>
                                                <div className="flex justify-between text-xs font-medium text-white/50 mb-1">
                                                    <span>Progress</span>
                                                    <span>{task.progress}%</span>
                                                </div>
                                                <div className="relative w-full h-2 bg-[#111814] rounded-full overflow-hidden mb-1">
                                                    <div
                                                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${getGradient(task.categoryColor)}`}
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={task.progress}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleProgressChange(task.id, parseInt(e.target.value));
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full h-2 -mt-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-glow"
                                                />
                                            </div>
                                        )}

                                        {/* Timer Section */}
                                        {hasTimer && (
                                            <div className="bg-[#111814] rounded-xl p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white text-2xl font-mono font-bold tracking-wider">
                                                        {formatTime(hasTimer.seconds)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStopTimer(task.id);
                                                        }}
                                                        className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-white text-[18px]">stop</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleTimer(task.id);
                                                        }}
                                                        className="size-10 bg-primary rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-glow"
                                                    >
                                                        <span className="material-symbols-outlined text-black text-[20px]">
                                                            {hasTimer.isRunning ? 'pause' : 'play_arrow'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timer Toggle Button */}
                                        {!hasTimer && !isCompleted && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPendingTimerTaskId(task.id);
                                                    setIsTimerModalOpen(true);
                                                }}
                                                className="w-full py-2 bg-[#111814] border border-[#2d4a38] rounded-xl text-white/70 text-sm font-medium hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">timer</span>
                                                Start Timer
                                            </button>
                                        )}

                                        {/* Linking Section */}
                                        {!isCompleted && (
                                            <div className="pt-3 border-t border-surface-border">
                                                {task.long_task_id ? (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-white/60 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                                            {longerTasks.find(lt => lt.id === task.long_task_id)?.title || 'Linked Task'}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLinkToLongerTask(task.id, null);
                                                            }}
                                                            className="text-red-400 text-xs hover:text-red-300 transition-colors"
                                                        >
                                                            Unlink
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        value=""
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const value = e.target.value;
                                                            if (value === 'create-new') {
                                                                setPendingLinkTaskId(task.id);
                                                                setIsLongerTaskModalOpen(true);
                                                            } else if (value) {
                                                                handleLinkToLongerTask(task.id, value);
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full bg-[#111814] border border-surface-border rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition-colors"
                                                    >
                                                        <option value="">Link to Longer Task...</option>
                                                        {longerTasks.map(lt => (
                                                            <option key={lt.id} value={lt.id}>{lt.title}</option>
                                                        ))}
                                                        <option value="create-new">+ Create New Long Task</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                task={editingTask}
                currentDate={currentDate}
                userId={user!.id}
                existingCategories={categories.map(c => ({ name: c.name, color: c.color }))}
                onSave={handleSaveTask}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                }}
            />

            {/* Push to Later Dialog */}
            <PushToLaterDialog
                isOpen={pushToLater.isOpen}
                taskTitle={pushToLater.task?.title || ''}
                onConfirm={handlePushToLater}
                onClose={() => setPushToLater({ isOpen: false, task: null })}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null })}
            />

            <AddLongerTaskModal
                isOpen={isLongerTaskModalOpen}
                userId={user!.id}
                onClose={() => {
                    setIsLongerTaskModalOpen(false);
                    setPendingLinkTaskId(null);
                }}
                onSave={handleCreateAndLinkLongerTask}
            />

            <TimerDurationModal
                isOpen={isTimerModalOpen}
                onClose={() => {
                    setIsTimerModalOpen(false);
                    setPendingTimerTaskId(null);
                }}
                onStart={(minutes) => {
                    if (pendingTimerTaskId) {
                        handleStartTimer(pendingTimerTaskId, minutes);
                        setPendingTimerTaskId(null);
                    }
                }}
            />

            {/* Quick Capture Modal for Revisits */}
            <QuickCaptureModal
                isOpen={isQuickCaptureOpen}
                userId={user!.id}
                onSave={async (input) => {
                    try {
                        await createRevisit(input);
                        toast.success('📌 Revisit saved!');
                        fetchTodayRevisits(user!.id);
                    } catch {
                        toast.error('Failed to save revisit');
                    }
                }}
                onClose={() => setIsQuickCaptureOpen(false)}
            />
        </div>
    );
};

export default MobileTodaysFocus;

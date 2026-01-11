import React, { useState } from 'react';
import { Task, FilterType } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import { useLongerTaskStore } from '../src/stores/longerTaskStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import TaskModal from '../src/components/TaskModal';
import ConfirmDialog from '../src/components/ConfirmDialog';
import PushToLaterDialog from '../src/components/PushToLaterDialog';
import AddLongerTaskModal from '../src/components/AddLongerTaskModal';
import toast from 'react-hot-toast';
import { formatDate, formatDeadlineTime } from '../src/utils/dateUtils';
import { formatTimeSpent, formatTimeDifference, isOverEstimate } from '../src/utils/timeUtils';
import { useTimerSync } from '../src/hooks/useTimerSync';

interface TaskColumnProps {
    currentDate: Date;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const tasks = useTaskStore((state) => state.tasks);
    const filter = useTaskStore((state) => state.filter);
    const setFilter = useTaskStore((state) => state.setFilter);
    const createTask = useTaskStore((state) => state.createTask);
    const updateTask = useTaskStore((state) => state.updateTask);
    const deleteTask = useTaskStore((state) => state.deleteTask);
    const updateProgress = useTaskStore((state) => state.updateProgress);
    const toggleComplete = useTaskStore((state) => state.toggleComplete);
    const linkToLongerTask = useTaskStore((state) => state.linkToLongerTask);

    const { longerTasks, fetchLongerTasks, createLongerTask } = useLongerTaskStore();
    const categories = useCategoryStore((state) => state.categories);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });
    const [pushToLater, setPushToLater] = useState<{ isOpen: boolean; task: Task | null }>({
        isOpen: false,
        task: null,
    });
    const [timerDialog, setTimerDialog] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });
    const [timerDuration, setTimerDuration] = useState({ hours: 0, minutes: 25 });
    const [isLongerTaskModalOpen, setIsLongerTaskModalOpen] = useState(false);
    const [pendingLinkTaskId, setPendingLinkTaskId] = useState<string | null>(null);

    // Use timer sync hook for real-time synchronization
    const { activeTimers, startTimer, stopTimer, toggleTimer } = useTimerSync(user!.id, currentDate);

    // Timer countdown is now handled by useTimerSync hook

    const handleProgressChange = async (id: string, newProgress: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Update progress only
        updateProgress(id, newProgress);
    };

    const handleToggleComplete = async (id: string, isCompleted: boolean) => {
        try {
            await toggleComplete(id, !isCompleted);
            toast.success(isCompleted ? 'Task reopened' : 'Task completed! 🎉');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDeleteTask = (taskId: string) => {
        setDeleteConfirm({ isOpen: true, taskId });
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

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editingTask) {
                await updateTask(editingTask.id, taskData);
                toast.success('Task updated');
            } else {
                await createTask(taskData);
                toast.success('Task created');
            }
        } catch (error) {
            toast.error('Failed to save task');
        }
    };

    const handlePushToLater = async (newDate: Date) => {
        if (!pushToLater.task) return;

        try {
            await updateTask(pushToLater.task.id, {
                scheduled_date: formatDate(newDate),
            });
            toast.success(`Task moved to ${newDate.toLocaleDateString()}`);
            setPushToLater({ isOpen: false, task: null });
        } catch (error) {
            toast.error('Failed to reschedule task');
        }
    };

    const handleStartTimer = async () => {
        if (!timerDialog.taskId) return;

        const totalMinutes = (timerDuration.hours * 60) + timerDuration.minutes;

        if (totalMinutes === 0) {
            toast.error('Please set a timer duration');
            return;
        }

        try {
            await startTimer(timerDialog.taskId, totalMinutes);
            setTimerDialog({ isOpen: false, taskId: null });
            setTimerDuration({ hours: 0, minutes: 25 });
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

    const handleStopTimer = async (taskId: string) => {
        try {
            await stopTimer(taskId);
            // Refresh tasks to get updated time_spent
            await useTaskStore.getState().fetchTasks(user!.id, formatDate(currentDate));
        } catch (error) {
            // Error already handled in hook
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getColorClasses = (color: string, isBg = false) => {
        const map: Record<string, string> = {
            indigo: isBg ? 'bg-indigo-500' : 'text-indigo-300 bg-indigo-500/20',
            primary: isBg ? 'bg-primary' : 'text-primary bg-primary/20',
            emerald: isBg ? 'bg-emerald-500' : 'text-emerald-400 bg-emerald-500/20',
            purple: isBg ? 'bg-purple-500' : 'text-purple-300 bg-purple-500/20',
            pink: isBg ? 'bg-pink-500' : 'text-pink-300 bg-pink-500/20',
        };
        return map[color] || (isBg ? 'bg-gray-500' : 'text-gray-300 bg-gray-500/20');
    };

    const getGradient = (color: string) => {
        if (color === 'indigo') return 'bg-gradient-to-r from-blue-500 to-indigo-500';
        return getColorClasses(color, true);
    };

    // Dynamically get unique categories from tasks
    const uniqueCategories = ['All Tasks', ...Array.from(new Set(tasks.map(task => task.category)))];

    // Filter tasks based on selected filter
    const filteredTasks = tasks.filter((task) => {
        if (filter === 'All Tasks') return true;
        return task.category === filter;
    });

    return (
        <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-1 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueCategories.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as FilterType)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === f
                            ? 'bg-primary text-[#111814]'
                            : 'bg-surface-dark border border-surface-border text-white font-medium hover:bg-surface-border'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Add Task Button */}
            <button
                onClick={handleCreateTask}
                className="w-full py-3 rounded-2xl bg-surface-dark border-2 border-dashed border-surface-border hover:border-primary/50 text-[#9db9a8] hover:text-primary transition-all flex items-center justify-center gap-2 group"
            >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-[20px]">add_circle</span>
                <span className="font-medium text-sm">Add New Task</span>
            </button>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-[#9db9a8]">
                    <span className="material-symbols-outlined text-4xl mb-3 opacity-30">task_alt</span>
                    <p>No tasks for this day. Create one to get started!</p>
                </div>
            ) : (
                filteredTasks.map(task => (
                    <ExpandableTaskCard
                        key={task.id}
                        task={task}
                        activeTimer={activeTimers[task.id]}
                        categories={categories}
                        longerTasks={longerTasks}
                        onToggleComplete={handleToggleComplete}
                        onUpdateProgress={handleProgressChange}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onStartTimer={(taskId) => setTimerDialog({ isOpen: true, taskId })}
                        onStopTimer={handleStopTimer}
                        onToggleTimer={handleToggleTimer}
                        onPushToLater={(task) => setPushToLater({ isOpen: true, task })}
                        onLinkToLongerTask={linkToLongerTask}
                        onCreateLongerTask={(taskId) => {
                            setPendingLinkTaskId(taskId);
                            setIsLongerTaskModalOpen(true);
                        }}
                        formatTime={formatTime}
                        getColorClasses={getColorClasses}
                        getGradient={getGradient}
                    />
                ))
            )}


            <TaskModal
                isOpen={isModalOpen}
                task={editingTask}
                currentDate={currentDate}
                userId={user!.id}
                existingCategories={categories.map(c => ({ name: c.name, color: c.color }))}
                onSave={handleSaveTask}
                onClose={() => setIsModalOpen(false)}
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

            {/* Push to Later Dialog */}
            <PushToLaterDialog
                isOpen={pushToLater.isOpen}
                taskTitle={pushToLater.task?.title || ''}
                onConfirm={handlePushToLater}
                onClose={() => setPushToLater({ isOpen: false, task: null })}
            />

            {/* Timer Duration Dialog */}
            {timerDialog.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">timer</span>
                                Set Timer Duration
                            </h3>
                            <button
                                onClick={() => setTimerDialog({ isOpen: false, taskId: null })}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-white/60 text-sm mb-6">
                            How long would you like to work on this task?
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={timerDuration.hours}
                                    onChange={(e) => setTimerDuration({ ...timerDuration, hours: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white text-center text-2xl font-mono focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-white/80 text-sm font-medium mb-2">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={timerDuration.minutes}
                                    onChange={(e) => setTimerDuration({ ...timerDuration, minutes: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white text-center text-2xl font-mono focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setTimerDuration({ hours: 0, minutes: 15 })}
                                className="flex-1 py-2 bg-surface-border hover:bg-primary/20 hover:border-primary border border-transparent rounded-lg text-white/70 hover:text-primary text-sm transition-all"
                            >
                                15 min
                            </button>
                            <button
                                onClick={() => setTimerDuration({ hours: 0, minutes: 25 })}
                                className="flex-1 py-2 bg-surface-border hover:bg-primary/20 hover:border-primary border border-transparent rounded-lg text-white/70 hover:text-primary text-sm transition-all"
                            >
                                25 min
                            </button>
                            <button
                                onClick={() => setTimerDuration({ hours: 0, minutes: 45 })}
                                className="flex-1 py-2 bg-surface-border hover:bg-primary/20 hover:border-primary border border-transparent rounded-lg text-white/70 hover:text-primary text-sm transition-all"
                            >
                                45 min
                            </button>
                            <button
                                onClick={() => setTimerDuration({ hours: 1, minutes: 0 })}
                                className="flex-1 py-2 bg-surface-border hover:bg-primary/20 hover:border-primary border border-transparent rounded-lg text-white/70 hover:text-primary text-sm transition-all"
                            >
                                1 hour
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setTimerDialog({ isOpen: false, taskId: null })}
                                className="flex-1 py-3 bg-surface-border hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartTimer}
                                className="flex-1 py-3 bg-primary hover:brightness-110 rounded-xl text-black font-bold transition-all shadow-glow"
                            >
                                Start Timer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Longer Task Modal */}
            {isLongerTaskModalOpen && (
                <AddLongerTaskModal
                    isOpen={isLongerTaskModalOpen}
                    userId={user!.id}
                    onClose={() => {
                        setIsLongerTaskModalOpen(false);
                        setPendingLinkTaskId(null);
                    }}
                    onSave={async (taskData) => {
                        await createLongerTask(taskData);
                        const newLongerTask = useLongerTaskStore.getState().longerTasks[0];
                        if (pendingLinkTaskId && newLongerTask) {
                            await linkToLongerTask(pendingLinkTaskId, newLongerTask.id);
                            toast.success('Longer task created and linked!');
                        }
                        setPendingLinkTaskId(null);
                    }}
                />
            )}
        </div>
    );
};

const ExpandableTaskCard = ({
    task,
    activeTimer,
    categories,
    longerTasks,
    onToggleComplete,
    onUpdateProgress,
    onEdit,
    onDelete,
    onStartTimer,
    onStopTimer,
    onToggleTimer,
    onPushToLater,
    onLinkToLongerTask,
    onCreateLongerTask,
    formatTime,
    getColorClasses,
    getGradient
}: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Circular Progress Component (Internal)
    const CircularProgress = ({ value, color, size = 'sm', showText = false }: { value: number, color: string, size?: 'sm' | 'md' | 'lg', showText?: boolean }) => {
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        // Map category color to hex/class - simple mapping for demo
        const getColor = (c: string) => {
            if (c === 'primary') return '#4ade80'; // emerald-400
            if (c === 'indigo') return '#818cf8';
            if (c === 'emerald') return '#22c55e';
            if (c === 'purple') return '#c084fc';
            if (c === 'pink') return '#f472b6';
            return '#9ca3af';
        };

        const sizeClasses = {
            sm: 'size-8 text-[10px]',
            md: 'size-10 text-xs',
            lg: 'size-12 text-sm'
        };

        return (
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                <svg className="transform -rotate-90 size-full" viewBox="0 0 36 36">
                    {/* Background Ring */}
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-white/5"
                    />
                    {/* Progress Ring */}
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
                {showText && (
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
                        {Math.round(value)}%
                    </div>
                )}
            </div>
        );
    };

    // Close on click outside (only if timer is NOT active)
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeTimer) return; // Do not collapse if timer is running

            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded, activeTimer]);

    // Auto-expand if timer is active
    React.useEffect(() => {
        if (activeTimer) {
            setIsExpanded(true);
        }
    }, [activeTimer]);

    if (task.isCompleted) {
        return (
            <div className="group bg-surface-dark/60 border border-surface-border rounded-2xl p-4 shadow-card transition-all duration-300 opacity-80 hover:opacity-100">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                            {task.category}
                        </span>
                        <h3 className="text-lg font-bold text-white line-through decoration-emerald-500 decoration-2">{task.title}</h3>
                    </div>
                    <button
                        onClick={() => onToggleComplete(task.id, task.isCompleted)}
                        className="size-7 bg-emerald-500 rounded-full flex items-center justify-center text-[#111814] hover:brightness-110 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                    </button>
                </div>
                {/* Completed Details */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            <span>Completed</span>
                        </div>
                        {task.time_spent !== undefined && task.time_spent > 0 ? (
                            <div className="text-xs text-white/70 ml-6">
                                Actual: {formatTimeSpent(task.time_spent)}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            onClick={() => !isExpanded && setIsExpanded(true)}
            className={`group bg-surface-dark border border-surface-border rounded-2xl shadow-card transition-all duration-300 relative overflow-hidden
            ${isExpanded ? 'p-4 ring-1 ring-primary/50 bg-[#161e19]' : 'p-3 hover:bg-[#202d26] hover:border-primary/30 cursor-pointer'}
            `}
        >
            {/* Header / Compact View */}
            <div className={`flex ${isExpanded ? 'justify-between items-start' : 'items-center gap-3'}`}>

                {/* Left Side Progress (Collapsed Only) */}
                {!isExpanded && (
                    <div className="shrink-0">
                        <CircularProgress value={task.progress} color={task.categoryColor} size="lg" showText={true} />
                    </div>
                )}

                {/* Content: Title, Category, Time */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                            {task.category}
                        </span>
                    </div>
                    <h3 className={`font-bold text-white truncate ${isExpanded ? 'text-lg' : 'text-base'}`}>{task.title}</h3>

                    {/* Time Info (Always Visible) */}
                    <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {formatTimeSpent(task.estimatedHours)}
                        </span>
                        {task.deadline && (
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                Due {formatDeadlineTime(task.deadline)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side: Actions (Expanded Only) */}
                {isExpanded && (
                    <div className="flex items-center gap-2 shrink-0 animate-fade-in pl-2">
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onStartTimer(task.id); }}
                                className="size-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                title="Start timer"
                            >
                                <span className="material-symbols-outlined text-[20px]">timer</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onPushToLater(task); }}
                                className="size-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                title="Push to later"
                            >
                                <span className="material-symbols-outlined text-[20px]">schedule_send</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                className="size-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                title="Edit task"
                            >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                className="size-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-500 hover:bg-white/10 transition-colors"
                                title="Delete task"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expandable Content matches ORIGINAL design */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-0' : 'max-h-0 opacity-0'}`}>
                <div className="pt-2 animate-fade-in space-y-3">
                    {/* Header Actions removed from here - now in Header (Right Side) */}

                    {/* Timer Display */}
                    {activeTimer && (
                        <div className={`mb-3 border rounded-xl p-3 flex items-center justify-between ${activeTimer.isStopwatch
                            ? 'bg-emerald-950/30 border-emerald-500/30'
                            : 'bg-[#111814] border-surface-border'
                            }`}>
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined text-[24px] ${activeTimer.isStopwatch ? 'text-emerald-400' : 'text-primary'
                                    }`}>
                                    {activeTimer.isStopwatch ? 'counter_1' : 'timer'}
                                </span>
                                <div className="flex flex-col">
                                    <span className={`text-2xl font-mono font-bold tracking-wider ${activeTimer.isStopwatch ? 'text-emerald-400' : 'text-white'
                                        }`}>
                                        {activeTimer.isStopwatch && '+'}
                                        {formatTime(activeTimer.seconds)}
                                    </span>
                                    {activeTimer.isStopwatch && (
                                        <span className="text-xs text-emerald-400/70 mt-0.5">Stopwatch mode</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStopTimer(task.id); }}
                                    className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-white text-[18px]">stop</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                                    className={`size-10 rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-glow ${activeTimer.isStopwatch ? 'bg-emerald-500' : 'bg-primary'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-black text-[20px]">
                                        {activeTimer.isRunning ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Interactive Progress Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs font-medium text-[#9db9a8] mb-1">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-primary/80">← Slide to update progress →</span>
                        </div>
                        <div className="relative w-full h-2 bg-surface-border rounded-full overflow-hidden group">
                            <div
                                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out ${getGradient(task.categoryColor)}`}
                                style={{ width: `${task.progress}%` }}
                            ></div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => onUpdateProgress(task.id, parseInt(e.target.value))}
                            className="w-full h-2 -mt-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow"
                            title={`Drag to update progress (${task.progress}%)`}
                        />
                    </div>

                    {/* Linking Section */}
                    <div className="pt-3 border-t border-surface-border">
                        {task.long_task_id ? (
                            <div className="flex items-center justify-between mb-2">
                                <div
                                    className="flex items-center gap-2 text-sm text-primary/80 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => {
                                        const longerTask = longerTasks.find((lt: any) => lt.id === task.long_task_id);
                                        if (longerTask) {
                                            toast.success(`Linked to: ${longerTask.title}`);
                                        }
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px]">link</span>
                                    <span>Linked to: {longerTasks.find((lt: any) => lt.id === task.long_task_id)?.title || 'Unknown'}</span>
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await onLinkToLongerTask(task.id, null);
                                            toast.success('Task unlinked');
                                        } catch (error) {
                                            toast.error('Failed to unlink');
                                        }
                                    }}
                                    className="text-white/40 hover:text-red-500 transition-colors"
                                    title="Unlink"
                                >
                                    <span className="material-symbols-outlined text-[18px]">link_off</span>
                                </button>
                            </div>
                        ) : (
                            <div className="mb-2">
                                <select
                                    value=""
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        if (value === 'create-new') {
                                            onCreateLongerTask(task.id);
                                        } else if (value) {
                                            try {
                                                await onLinkToLongerTask(task.id, value);
                                                toast.success('Task linked!');
                                            } catch (error) {
                                                toast.error('Failed to link');
                                            }
                                        }
                                    }}
                                    className="w-full bg-[#111814] border border-surface-border rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="">Link to Longer Task...</option>
                                    {longerTasks.map((lt: any) => (
                                        <option key={lt.id} value={lt.id}>{lt.title}</option>
                                    ))}
                                    <option value="create-new">+ Create New Long Task</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-[#9db9a8]">
                                <span className="material-symbols-outlined text-base">schedule</span>
                                <span>Estimated: {formatTimeSpent(task.estimatedHours)}{task.deadline ? ` • Due ${formatDeadlineTime(task.deadline)}` : ''}</span>
                            </div>
                            {task.time_spent !== undefined && task.time_spent > 0 && (
                                <div className="text-xs text-white/60 ml-6">
                                    Time spent so far: {formatTimeSpent(task.time_spent)}
                                    {task.time_spent > task.estimatedHours && (
                                        <span className="text-orange-400"> (over estimate)</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id, task.isCompleted); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-border hover:bg-primary/20 hover:border-primary border border-transparent text-white/70 hover:text-primary transition-all group"
                        >
                            <div className={`size-5 rounded-md flex items-center justify-center transition-all ${task.isCompleted
                                ? 'bg-primary text-black'
                                : 'border-2 border-white/30 group-hover:border-primary'
                                }`}>
                                {task.isCompleted && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                            </div>
                            <span className="text-sm font-medium">Mark as Complete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskColumn;
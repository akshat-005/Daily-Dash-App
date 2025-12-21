import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import { useLongerTaskStore } from '../src/stores/longerTaskStore';
import { useCategoryStore } from '../src/stores/categoryStore';
import TaskModal from '../src/components/TaskModal';
import PushToLaterDialog from '../src/components/PushToLaterDialog';
import ConfirmDialog from '../src/components/ConfirmDialog';
import AddLongerTaskModal from '../src/components/AddLongerTaskModal';
import TimerDurationModal from '../src/components/TimerDurationModal';
import toast from 'react-hot-toast';
import { formatDate, formatDeadlineTime, addDays } from '../src/utils/dateUtils';
import { formatTimeSpent, formatTimeDifference, isOverEstimate } from '../src/utils/timeUtils';
import * as timerSessionsApi from '../src/api/timerSessions';

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLongerTaskModalOpen, setIsLongerTaskModalOpen] = useState(false);
    const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
    const [pendingLinkTaskId, setPendingLinkTaskId] = useState<string | null>(null);
    const [pendingTimerTaskId, setPendingTimerTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeTimers, setActiveTimers] = useState<Record<string, { seconds: number; isRunning: boolean; sessionId?: string }>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [pushToLater, setPushToLater] = useState<{ isOpen: boolean; task: Task | null }>({
        isOpen: false,
        task: null,
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTimers((prev) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((taskId) => {
                    if (updated[taskId].isRunning && updated[taskId].seconds > 0) {
                        updated[taskId].seconds -= 1;
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

    const toggleTimer = async (taskId: string, customMinutes?: number) => {
        const timer = activeTimers[taskId];

        if (!timer && customMinutes !== undefined) {
            // Start new timer with database session
            const totalSeconds = customMinutes * 60;
            try {
                const session = await timerSessionsApi.startTimerSession(taskId, user!.id);
                setActiveTimers((prev) => ({
                    ...prev,
                    [taskId]: { seconds: totalSeconds, isRunning: true, sessionId: session.id },
                }));
                toast.success('Timer started!');
            } catch (error) {
                console.error('Failed to start timer session:', error);
                toast.error('Failed to start timer');
            }
        } else if (timer) {
            // Toggle pause/play
            setActiveTimers((prev) => ({
                ...prev,
                [taskId]: { ...timer, isRunning: !timer.isRunning },
            }));
        }
    };

    const stopTimer = async (taskId: string) => {
        const timer = activeTimers[taskId];
        if (timer?.sessionId) {
            try {
                await timerSessionsApi.stopTimerSession(timer.sessionId);
                // Refresh tasks to get updated time_spent
                await useTaskStore.getState().fetchTasks(user!.id, formatDate(currentDate));
            } catch (error) {
                console.error('Failed to stop timer session:', error);
            }
        }
        setActiveTimers((prev) => {
            const updated = { ...prev };
            delete updated[taskId];
            return updated;
        });
        toast.success('Timer stopped');
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

                        return (
                            <div
                                key={task.id}
                                className={`bg-[#1a2d23] border border-[#2d4a38] rounded-2xl p-4 ${isCompleted ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`size-10 rounded-full ${getIconBgColor(task.categoryColor)} flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-white text-[20px]">
                                                {task.category === 'Deep Work' ? 'psychology' : task.category === 'Health' ? 'favorite' : 'work'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-white font-bold text-base ${isCompleted ? 'line-through' : ''}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getColorClasses(task.categoryColor)}`}>
                                                    {task.category}
                                                </span>
                                                <span className="text-white/50 text-xs">
                                                    {task.estimatedHours}h{task.deadline ? ` • Target: ${formatDeadlineTime(task.deadline)}` : ''}
                                                </span>
                                            </div>
                                            {task.time_spent !== undefined && task.time_spent > 0 && (
                                                <div className="text-[10px] text-white/60 mt-1">
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
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Menu Button */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : task.id)}
                                                className="size-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isMenuOpen && (
                                                <div className="absolute right-0 top-10 bg-[#111814] border border-[#2d4a38] rounded-xl shadow-lg overflow-hidden z-10 min-w-[160px]">
                                                    <button
                                                        onClick={() => handleEditTask(task)}
                                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1a2d23] transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        Edit Task
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPushToLater({ isOpen: true, task });
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1a2d23] transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">schedule_send</span>
                                                        Push to Later
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        Delete Task
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Completion Toggle */}
                                        <button
                                            onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                            className={`size-8 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-primary text-black'
                                                : 'border-2 border-white/30 text-transparent hover:border-primary'
                                                }`}
                                        >
                                            {isCompleted && <span className="material-symbols-outlined text-[18px] font-bold">check</span>}
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Slider */}
                                {!isCompleted && (
                                    <div className="mb-3">
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
                                            onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
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
                                                onClick={() => stopTimer(task.id)}
                                                className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-white text-[18px]">stop</span>
                                            </button>
                                            <button
                                                onClick={() => toggleTimer(task.id)}
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
                                        onClick={() => {
                                            setPendingTimerTaskId(task.id);
                                            setIsTimerModalOpen(true);
                                        }}
                                        className="w-full mt-2 py-2 bg-[#111814] border border-[#2d4a38] rounded-xl text-white/70 text-sm font-medium hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">timer</span>
                                        Start Timer
                                    </button>
                                )}

                                {/* Linking Section */}
                                {!isCompleted && (
                                    <div className="mt-3 pt-3 border-t border-surface-border">
                                        {task.long_task_id ? (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[16px]">link</span>
                                                    {longerTasks.find(lt => lt.id === task.long_task_id)?.title || 'Linked Task'}
                                                </span>
                                                <button
                                                    onClick={() => handleLinkToLongerTask(task.id, null)}
                                                    className="text-red-400 text-xs hover:text-red-300 transition-colors"
                                                >
                                                    Unlink
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === 'create-new') {
                                                        setPendingLinkTaskId(task.id);
                                                        setIsLongerTaskModalOpen(true);
                                                    } else if (value) {
                                                        handleLinkToLongerTask(task.id, value);
                                                    }
                                                }}
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
                existingCategories={useCategoryStore.getState().categories.map(c => ({ name: c.name, color: c.color }))}
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
                        toggleTimer(pendingTimerTaskId, minutes);
                        setPendingTimerTaskId(null);
                    }
                }}
            />
        </div>
    );
};

export default MobileTodaysFocus;

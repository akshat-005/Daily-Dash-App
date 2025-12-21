import React, { useState, useEffect } from 'react';
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
import * as timerSessionsApi from '../src/api/timerSessions';

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
    const [activeTimers, setActiveTimers] = useState<Record<string, { seconds: number; isRunning: boolean; sessionId?: string }>>({});
    const [timerDialog, setTimerDialog] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });
    const [timerDuration, setTimerDuration] = useState({ hours: 0, minutes: 25 });
    const [isLongerTaskModalOpen, setIsLongerTaskModalOpen] = useState(false);
    const [pendingLinkTaskId, setPendingLinkTaskId] = useState<string | null>(null);

    // Timer countdown logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTimers((prev) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((taskId) => {
                    if (updated[taskId].isRunning && updated[taskId].seconds > 0) {
                        updated[taskId].seconds -= 1;

                        // Notify when timer completes
                        if (updated[taskId].seconds === 0) {
                            toast.success('Timer completed! 🎉', { duration: 5000 });
                            updated[taskId].isRunning = false;
                        }
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

    const handleStartTimer = (taskId: string) => {
        setTimerDialog({ isOpen: true, taskId });
    };

    const confirmStartTimer = async () => {
        if (!timerDialog.taskId) return;

        const totalSeconds = (timerDuration.hours * 3600) + (timerDuration.minutes * 60);

        if (totalSeconds === 0) {
            toast.error('Please set a timer duration');
            return;
        }

        try {
            // Start timer session in database
            const session = await timerSessionsApi.startTimerSession(timerDialog.taskId, user!.id);

            setActiveTimers((prev) => ({
                ...prev,
                [timerDialog.taskId!]: { seconds: totalSeconds, isRunning: true, sessionId: session.id },
            }));

            setTimerDialog({ isOpen: false, taskId: null });
            setTimerDuration({ hours: 0, minutes: 25 });
            toast.success('Timer started!');
        } catch (error) {
            console.error('Failed to start timer session:', error);
            toast.error('Failed to start timer');
        }
    };

    const toggleTimer = (taskId: string) => {
        setActiveTimers((prev) => ({
            ...prev,
            [taskId]: { ...prev[taskId], isRunning: !prev[taskId].isRunning },
        }));
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
                filteredTasks.map(task => {
                    if (task.isCompleted) {
                        return (
                            <div key={task.id} className="group bg-surface-dark/60 border border-surface-border rounded-2xl p-4 shadow-card transition-all duration-300 opacity-80 hover:opacity-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                                            {task.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-white line-through decoration-emerald-500 decoration-2">{task.title}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                        className="size-7 bg-emerald-500 rounded-full flex items-center justify-center text-[#111814] hover:brightness-110 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                                    </button>
                                </div>
                                <div className="mb-3">
                                    <div className="relative w-full h-2 bg-surface-border rounded-full overflow-hidden">
                                        <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            <span>Completed</span>
                                        </div>
                                        {task.time_spent !== undefined && task.time_spent > 0 ? (
                                            <div className="text-xs text-white/70 ml-6">
                                                Estimated: {formatTimeSpent(task.estimatedHours)} | Actual: {formatTimeSpent(task.time_spent)}
                                                {task.time_spent !== task.estimatedHours && (
                                                    <span className={isOverEstimate(task.time_spent, task.estimatedHours) ? ' text-orange-400' : ' text-primary'}>
                                                        {' '}({formatTimeDifference(task.time_spent, task.estimatedHours)})
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-white/50 ml-6">
                                                {task.estimatedHours}h estimated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={task.id} className="group bg-surface-dark hover:bg-[#202d26] border border-surface-border hover:border-primary/30 rounded-2xl p-4 shadow-card transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                                        {task.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStartTimer(task.id)}
                                        className="text-white/40 hover:text-primary transition-colors"
                                        title="Start timer"
                                    >
                                        <span className="material-symbols-outlined">timer</span>
                                    </button>
                                    <button
                                        onClick={() => setPushToLater({ isOpen: true, task })}
                                        className="text-white/40 hover:text-primary transition-colors"
                                        title="Push to later"
                                    >
                                        <span className="material-symbols-outlined">schedule_send</span>
                                    </button>
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="text-white/40 hover:text-primary transition-colors"
                                        title="Edit task"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-white/40 hover:text-red-500 transition-colors"
                                        title="Delete task"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Timer Display */}
                            {activeTimers[task.id] && (
                                <div className="mb-3 bg-[#111814] border border-surface-border rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-[24px]">timer</span>
                                        <span className="text-white text-2xl font-mono font-bold tracking-wider">
                                            {formatTime(activeTimers[task.id].seconds)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => stopTimer(task.id)}
                                            className="size-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                                            title="Stop timer"
                                        >
                                            <span className="material-symbols-outlined text-white text-[18px]">stop</span>
                                        </button>
                                        <button
                                            onClick={() => toggleTimer(task.id)}
                                            className="size-10 bg-primary rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-glow"
                                            title={activeTimers[task.id].isRunning ? 'Pause' : 'Play'}
                                        >
                                            <span className="material-symbols-outlined text-black text-[20px]">
                                                {activeTimers[task.id].isRunning ? 'pause' : 'play_arrow'}
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
                                    onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                                    className="w-full h-2 -mt-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-glow"
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
                                                const longerTask = longerTasks.find(lt => lt.id === task.long_task_id);
                                                if (longerTask) {
                                                    // Could open details modal here
                                                    toast.success(`Linked to: ${longerTask.title}`);
                                                }
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                            <span>Linked to: {longerTasks.find(lt => lt.id === task.long_task_id)?.title || 'Unknown'}</span>
                                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await linkToLongerTask(task.id, null);
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
                                                    setPendingLinkTaskId(task.id);
                                                    setIsLongerTaskModalOpen(true);
                                                } else if (value) {
                                                    try {
                                                        await linkToLongerTask(task.id, value);
                                                        toast.success('Task linked!');
                                                    } catch (error) {
                                                        toast.error('Failed to link');
                                                    }
                                                }
                                            }}
                                            className="w-full bg-[#111814] border border-surface-border rounded-lg px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                        >
                                            <option value="">Link to Longer Task...</option>
                                            {longerTasks.map(lt => (
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
                                    onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-border hover:bg-primary/20 border border-transparent hover:border-primary text-white/70 hover:text-primary transition-all group"
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
                    );
                })
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                task={editingTask}
                currentDate={currentDate}
                userId={user!.id}
                existingCategories={useCategoryStore.getState().categories.map(c => ({ name: c.name, color: c.color }))}
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
                                onClick={confirmStartTimer}
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

export default TaskColumn;
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import TaskModal from '../src/components/TaskModal';
import toast from 'react-hot-toast';
import { formatDate } from '../src/utils/dateUtils';

interface MobileTodaysFocusProps {
    currentDate: Date;
}

const MobileTodaysFocus: React.FC<MobileTodaysFocusProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const tasks = useTaskStore((state) => state.tasks);
    const toggleComplete = useTaskStore((state) => state.toggleComplete);
    const updateTask = useTaskStore((state) => state.updateTask);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeTimers, setActiveTimers] = useState<Record<string, { seconds: number; isRunning: boolean }>>({});

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

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
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

    const toggleTimer = (taskId: string) => {
        setActiveTimers((prev) => {
            if (prev[taskId]) {
                return {
                    ...prev,
                    [taskId]: { ...prev[taskId], isRunning: !prev[taskId].isRunning },
                };
            } else {
                // Initialize timer with estimated hours converted to seconds
                const task = tasks.find((t) => t.id === taskId);
                const initialSeconds = task ? task.estimatedHours * 60 * 60 : 3600;
                return {
                    ...prev,
                    [taskId]: { seconds: initialSeconds, isRunning: true },
                };
            }
        });
    };

    const stopTimer = (taskId: string) => {
        setActiveTimers((prev) => {
            const updated = { ...prev };
            delete updated[taskId];
            return updated;
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    return (
        <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-bold">Today's Focus</h2>
                <button className="text-primary text-sm font-medium flex items-center gap-1">
                    Edit
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                        <p>No tasks for today</p>
                    </div>
                ) : (
                    tasks.map((task) => {
                        const hasTimer = activeTimers[task.id];
                        const isCompleted = task.isCompleted;

                        return (
                            <div
                                key={task.id}
                                className={`bg-[#1a2d23] border border-[#2d4a38] rounded-2xl p-4 ${isCompleted ? 'opacity-70' : ''
                                    }`}
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
                                            <p className="text-white/50 text-xs mt-0.5">
                                                {task.deadline ? `Target: ${task.deadline}` : `${task.estimatedHours}h estimated`}
                                            </p>
                                        </div>
                                    </div>
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
                                        onClick={() => toggleTimer(task.id)}
                                        className="w-full mt-2 py-2 bg-[#111814] border border-[#2d4a38] rounded-xl text-white/70 text-sm font-medium hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">timer</span>
                                        Start Timer
                                    </button>
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
                existingCategories={Array.from(
                    new Map(tasks.map((t) => [t.category, { name: t.category, color: t.categoryColor }])).values()
                )}
                onSave={handleSaveTask}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default MobileTodaysFocus;

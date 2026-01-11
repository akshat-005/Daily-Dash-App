import React, { useState, useEffect } from 'react';
import { useLongerTaskStore } from '../stores/longerTaskStore';
import { useAuth } from '../contexts/AuthContext';
import AddLongerTaskModal from './AddLongerTaskModal';
import LongerTaskDetails from './LongerTaskDetails';
import { LongerTask } from '../../types';

interface LongerTasksListProps {
    compact?: boolean; // If true, use 2-column grid layout (for Statistics page)
}

const LongerTasksList: React.FC<LongerTasksListProps> = ({ compact = false }) => {
    const { user } = useAuth();
    const { longerTasks, isLoading, fetchLongerTasks, createLongerTask, updateLongerTask, deleteLongerTask } = useLongerTaskStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<LongerTask | null>(null);
    const [editTask, setEditTask] = useState<{ id: string; title: string; description?: string; deadline?: string; estimatedHours?: number } | null>(null);

    useEffect(() => {
        if (user) {
            fetchLongerTasks(user.id);
        }
    }, [user]);

    useEffect(() => {
        const handleEditEvent = (e: any) => {
            const { task, estimatedHours } = e.detail;
            setEditTask({
                id: task.id,
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                estimatedHours,
            });
            setIsModalOpen(true);
        };

        window.addEventListener('editLongerTask', handleEditEvent);
        return () => window.removeEventListener('editLongerTask', handleEditEvent);
    }, []);

    const handleSaveTask = async (taskData: { id?: string; user_id: string; title: string; description?: string; deadline?: string; estimatedHours?: number }) => {
        if (taskData.id) {
            // Update existing task
            await updateLongerTask(taskData.id, {
                title: taskData.title,
                description: taskData.description,
                deadline: taskData.deadline,
                estimatedHours: taskData.estimatedHours,
            });
            setEditTask(null);
        } else {
            // Create new task
            await createLongerTask(taskData);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('Are you sure you want to delete this longer task? All linked daily tasks will be unlinked.')) {
            await deleteLongerTask(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditTask(null);
    };

    const formatDeadline = (deadline?: string) => {
        if (!deadline) return null;
        const date = new Date(deadline);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">flag</span>
                        Longer Tasks
                    </h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:brightness-110 rounded-lg text-black text-sm font-bold transition-all shadow-glow"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-white/50">
                        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                    </div>
                ) : longerTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl mb-3 opacity-30 text-white">flag</span>
                        <p className="text-white/50 text-sm">No longer tasks yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div className={compact
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin"
                        : "space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin"
                    }>
                        {longerTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-[#111814] border border-surface-border hover:border-primary/40 rounded-xl p-3 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Circular Progress */}
                                    <div
                                        className="size-11 rounded-full flex items-center justify-center shrink-0 relative"
                                        style={{
                                            background: `conic-gradient(#2bee79 ${task.progress}%, #28392f ${task.progress}%)`
                                        }}
                                    >
                                        <div className="size-8 bg-[#111814] rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-[10px]">{task.progress}%</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-1">
                                            {task.title}
                                        </h3>

                                        <div className="flex items-center gap-2">
                                            {task.deadline ? (
                                                <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                                                    {formatDeadline(task.deadline)}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-white/30">No deadline</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hover actions */}
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTask(task.id);
                                            }}
                                            className="size-6 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                            title="Delete task"
                                        >
                                            <span className="material-symbols-outlined text-red-400 text-[14px]">delete</span>
                                        </button>
                                        <span className="material-symbols-outlined text-primary/50 text-[14px]">
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddLongerTaskModal
                isOpen={isModalOpen}
                userId={user!.id}
                editTask={editTask}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
            />

            {selectedTask && (
                <LongerTaskDetails
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </>
    );
};

export default LongerTasksList;

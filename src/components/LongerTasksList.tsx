import React, { useState, useEffect } from 'react';
import { useLongerTaskStore } from '../stores/longerTaskStore';
import { useAuth } from '../contexts/AuthContext';
import AddLongerTaskModal from './AddLongerTaskModal';
import LongerTaskDetails from './LongerTaskDetails';
import { LongerTask } from '../../types';

const LongerTasksList: React.FC = () => {
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
                    <div className="space-y-3">
                        {longerTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-[#111814] border border-surface-border hover:border-primary/30 rounded-xl p-3 transition-all cursor-pointer group"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors">
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="text-white/50 text-xs mt-1 line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(task.id);
                                        }}
                                        className="text-white/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-primary text-xs font-bold">{task.progress}%</span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    {task.deadline ? (
                                        <span className="text-white/40 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            {formatDeadline(task.deadline)}
                                        </span>
                                    ) : (
                                        <span className="text-white/40">No deadline</span>
                                    )}
                                    <span className="text-primary/70 flex items-center gap-1">
                                        View details
                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </span>
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

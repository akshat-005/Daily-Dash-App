import React, { useState } from 'react';
import { Task, FilterType } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import TaskModal from '../src/components/TaskModal';
import ConfirmDialog from '../src/components/ConfirmDialog';
import toast from 'react-hot-toast';

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({
        isOpen: false,
        taskId: null,
    });

    const handleProgressChange = async (id: string, newProgress: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Update progress
        updateProgress(id, newProgress);

        // Auto-complete when reaching 100%
        if (newProgress === 100 && !task.isCompleted) {
            try {
                await toggleComplete(id, false); // false because current state is not completed
                toast.success('Task completed! 🎉');
            } catch (error) {
                toast.error('Failed to complete task');
            }
        }
        // Auto-reopen when dragging below 100%
        else if (newProgress < 100 && task.isCompleted) {
            try {
                await toggleComplete(id, true); // true because current state is completed
                toast.success('Task reopened');
            } catch (error) {
                toast.error('Failed to reopen task');
            }
        }
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
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                        <span>Completed • {task.estimatedHours}h estimated</span>
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

                            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                                <div className="flex items-center gap-2 text-sm text-[#9db9a8]">
                                    <span className="material-symbols-outlined text-base">schedule</span>
                                    <span>{task.estimatedHours}h estimated{task.deadline ? ` • Due ${task.deadline}` : ''}</span>
                                </div>
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
                existingCategories={Array.from(
                    new Map(tasks.map(t => [t.category, { name: t.category, color: t.categoryColor }])).values()
                )}
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
        </div>
    );
};

export default TaskColumn;
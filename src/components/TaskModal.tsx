import React, { useState, useEffect } from 'react';
import { Task, CategoryColor } from '../../types';
import { formatDate } from '../utils/dateUtils';

interface TaskModalProps {
    isOpen: boolean;
    task?: Task | null;
    currentDate: Date;
    userId: string;
    onSave: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
    onClose: () => void;
}

const categories = [
    { name: 'Deep Block 1', color: 'indigo' as CategoryColor },
    { name: 'Deep Block 2', color: 'indigo' as CategoryColor },
    { name: 'Light Task', color: 'primary' as CategoryColor },
    { name: 'Health', color: 'emerald' as CategoryColor },
    { name: 'Creative', color: 'purple' as CategoryColor },
    { name: 'Admin', color: 'pink' as CategoryColor },
    { name: 'Meetings', color: 'indigo' as CategoryColor },
    { name: 'Deep Work', color: 'indigo' as CategoryColor },
];

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    task,
    currentDate,
    userId,
    onSave,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Deep Block 1');
    const [categoryColor, setCategoryColor] = useState<CategoryColor>('indigo');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setCategory(task.category);
            setCategoryColor(task.categoryColor);
            setStartTime(task.startTime);
            setEndTime(task.endTime);
        } else {
            setTitle('');
            setCategory('Deep Block 1');
            setCategoryColor('indigo');
            setStartTime('09:00');
            setEndTime('10:00');
        }
    }, [task, isOpen]);

    const handleCategoryChange = (categoryName: string) => {
        const selected = categories.find((c) => c.name === categoryName);
        if (selected) {
            setCategory(selected.name);
            setCategoryColor(selected.color);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
            user_id: userId,
            title,
            category,
            categoryColor,
            progress: task?.progress || 0,
            startTime,
            endTime,
            scheduled_date: formatDate(currentDate),
            isCompleted: task?.isCompleted || false,
            completed_at: task?.completed_at,
        };

        onSave(taskData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 max-w-lg w-full shadow-card">
                <h3 className="text-2xl font-bold text-white mb-6">
                    {task ? 'Edit Task' : 'Create New Task'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                            Task Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="What do you want to accomplish?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            {categories.map((cat) => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full bg-surface-border text-white font-medium hover:bg-[#3b5445] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-full bg-primary text-black font-bold hover:brightness-110 transition-all shadow-glow"
                        >
                            {task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;

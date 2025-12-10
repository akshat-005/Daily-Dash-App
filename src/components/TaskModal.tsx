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
    const [estimatedHours, setEstimatedHours] = useState('2');

    // Deadline time state
    const [deadlineHour, setDeadlineHour] = useState('5');
    const [deadlineMinute, setDeadlineMinute] = useState('00');
    const [deadlinePeriod, setDeadlinePeriod] = useState<'AM' | 'PM'>('PM');
    const [hasDeadline, setHasDeadline] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setCategory(task.category);
            setCategoryColor(task.categoryColor);
            setEstimatedHours(task.estimatedHours.toString());

            if (task.deadline) {
                setHasDeadline(true);
                const [time, period] = task.deadline.split(' ');
                const [hour, minute] = time.split(':');
                setDeadlineHour(hour);
                setDeadlineMinute(minute);
                setDeadlinePeriod(period as 'AM' | 'PM');
            } else {
                setHasDeadline(false);
            }
        } else {
            setTitle('');
            setCategory('Deep Block 1');
            setCategoryColor('indigo');
            setEstimatedHours('2');
            setHasDeadline(false);
            setDeadlineHour('5');
            setDeadlineMinute('00');
            setDeadlinePeriod('PM');
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

        const deadline = hasDeadline
            ? `${deadlineHour}:${deadlineMinute} ${deadlinePeriod}`
            : undefined;

        const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
            user_id: userId,
            title,
            category,
            categoryColor,
            progress: task?.progress || 0,
            estimatedHours: parseFloat(estimatedHours),
            deadline,
            scheduled_date: formatDate(currentDate),
            isCompleted: task?.isCompleted || false,
            completed_at: task?.completed_at,
        };

        onSave(taskData);
        onClose();
    };

    if (!isOpen) return null;

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = ['00', '15', '30', '45'];
    const estimatedHoursOptions = ['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 max-w-lg w-full shadow-card" onClick={(e) => e.stopPropagation()}>
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

                    <div>
                        <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                            Estimated Hours
                        </label>
                        <select
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            {estimatedHoursOptions.map((h) => (
                                <option key={h} value={h}>
                                    {h} {parseFloat(h) === 1 ? 'hour' : 'hours'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#9db9a8]">
                                Deadline (Optional)
                            </label>
                            <button
                                type="button"
                                onClick={() => setHasDeadline(!hasDeadline)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${hasDeadline
                                        ? 'bg-primary text-black'
                                        : 'bg-surface-border text-white hover:bg-[#3b5445]'
                                    }`}
                            >
                                {hasDeadline ? 'Remove' : 'Add Deadline'}
                            </button>
                        </div>

                        {hasDeadline && (
                            <div className="flex gap-2">
                                <select
                                    value={deadlineHour}
                                    onChange={(e) => setDeadlineHour(e.target.value)}
                                    className="flex-1 bg-[#111814] border border-surface-border rounded-xl px-2 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center"
                                >
                                    {hours.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                                <span className="text-white text-xl self-center">:</span>
                                <select
                                    value={deadlineMinute}
                                    onChange={(e) => setDeadlineMinute(e.target.value)}
                                    className="flex-1 bg-[#111814] border border-surface-border rounded-xl px-2 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center"
                                >
                                    {minutes.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={deadlinePeriod}
                                    onChange={(e) => setDeadlinePeriod(e.target.value as 'AM' | 'PM')}
                                    className="flex-1 bg-[#111814] border border-surface-border rounded-xl px-2 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        )}
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

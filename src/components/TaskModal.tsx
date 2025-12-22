import React, { useState, useEffect } from 'react';
import { Task, CategoryColor } from '../../types';
import { formatDate } from '../utils/dateUtils';
import { useCategoryStore } from '../stores/categoryStore';

interface TaskModalProps {
    isOpen: boolean;
    task?: Task | null;
    currentDate: Date;
    userId: string;
    existingCategories: Array<{ name: string; color: CategoryColor }>;
    onSave: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
    onClose: () => void;
}

const categoryColors: CategoryColor[] = ['indigo', 'primary', 'emerald', 'purple', 'pink'];

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    task,
    currentDate,
    userId,
    existingCategories,
    onSave,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [categoryMode, setCategoryMode] = useState<'select' | 'new'>('select');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryColor, setCategoryColor] = useState<CategoryColor>('primary');
    const [estimatedHours, setEstimatedHours] = useState(2);
    const [estimatedMinutes, setEstimatedMinutes] = useState(0);

    // Deadline time state
    const [deadlineHour, setDeadlineHour] = useState('5');
    const [deadlineMinute, setDeadlineMinute] = useState('00');
    const [deadlinePeriod, setDeadlinePeriod] = useState<'AM' | 'PM'>('PM');
    const [hasDeadline, setHasDeadline] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            // Check if task category exists in existing categories
            const existingCat = existingCategories.find(c => c.name === task.category);
            if (existingCat) {
                setCategoryMode('select');
                setSelectedCategory(task.category);
            } else {
                setCategoryMode('new');
                setNewCategoryName(task.category);
            }
            setCategoryColor(task.categoryColor);
            // Convert decimal hours to hours and minutes
            const totalHours = task.estimatedHours;
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);
            setEstimatedHours(hours);
            setEstimatedMinutes(minutes);


            if (task.deadline) {
                setHasDeadline(true);
                const parts = task.deadline.split(' ');
                const time = parts[0];
                let period = parts[1]; // Could be 'AM', 'PM', or undefined
                const [hourStr, minute] = time.split(':');
                let hour = parseInt(hourStr);

                // Convert 24-hour format to 12-hour format if no period specified
                if (!period) {
                    if (hour >= 12) {
                        period = 'PM';
                        if (hour > 12) hour = hour - 12;
                    } else {
                        period = 'AM';
                        if (hour === 0) hour = 12;
                    }
                }

                setDeadlineHour(hour.toString());
                setDeadlineMinute(minute || '00');
                setDeadlinePeriod(period as 'AM' | 'PM');
            } else {
                setHasDeadline(false);
                // Reset to defaults when no deadline
                setDeadlineHour('5');
                setDeadlineMinute('00');
                setDeadlinePeriod('PM');
            }
        } else {
            setTitle('');
            if (existingCategories.length > 0) {
                setCategoryMode('select');
                setSelectedCategory(existingCategories[0].name);
                setCategoryColor(existingCategories[0].color);
            } else {
                setCategoryMode('new');
                setNewCategoryName('');
            }
            setEstimatedHours(2);
            setEstimatedMinutes(0);
            setHasDeadline(false);
            setDeadlineHour('5');
            setDeadlineMinute('00');
            setDeadlinePeriod('PM');
        }
    }, [task, isOpen]); // Removed existingCategories from dependencies

    const handleCategorySelectChange = (value: string) => {
        if (value === '__new__') {
            setCategoryMode('new');
            setNewCategoryName('');
            setCategoryColor('primary');
        } else {
            setSelectedCategory(value);
            const cat = existingCategories.find(c => c.name === value);
            if (cat) {
                setCategoryColor(cat.color);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const categoryName = categoryMode === 'new' ? newCategoryName.trim() : selectedCategory;

        if (!categoryName) {
            alert('Please enter a category name');
            return;
        }

        // If new category, save it to the database
        if (categoryMode === 'new') {
            try {
                await useCategoryStore.getState().ensureCategoryExists(userId, categoryName, categoryColor);
            } catch (error) {
                console.error('Failed to save category:', error);
                // Continue anyway - the task will still be created
            }
        }


        // Validate deadline format
        const deadline = hasDeadline
            ? `${deadlineHour}:${deadlineMinute} ${deadlinePeriod || 'PM'}`
            : undefined;

        console.log('⏰ Deadline validation:', { hasDeadline, deadlineHour, deadlineMinute, deadlinePeriod, result: deadline });

        const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
            user_id: userId,
            title,
            category: categoryName,
            categoryColor,
            progress: task?.progress || 0,
            estimatedHours: estimatedHours + (estimatedMinutes / 60),
            deadline,
            scheduled_date: task?.scheduled_date || formatDate(currentDate), // Preserve original date when editing
            isCompleted: task?.isCompleted || false,
            completed_at: task?.completed_at,
        };

        console.log('📝 TaskModal submitting:', { task, taskData });

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
                        {categoryMode === 'select' ? (
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategorySelectChange(e.target.value)}
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                {existingCategories.map((cat) => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                                <option value="__new__">+ Add New Category</option>
                            </select>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    required
                                    className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Enter new category name..."
                                    autoFocus
                                />
                                {existingCategories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoryMode('select');
                                            setSelectedCategory(existingCategories[0].name);
                                            setCategoryColor(existingCategories[0].color);
                                        }}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        ← Back to existing categories
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                            Category Color
                        </label>
                        <div className="flex gap-3">
                            {categoryColors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setCategoryColor(color)}
                                    className={`size-10 rounded-full transition-all ${categoryColor === color
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-dark scale-110'
                                        : 'hover:scale-105'
                                        } ${color === 'indigo' ? 'bg-indigo-500' :
                                            color === 'primary' ? 'bg-primary' :
                                                color === 'emerald' ? 'bg-emerald-500' :
                                                    color === 'purple' ? 'bg-purple-500' :
                                                        'bg-pink-500'
                                        }`}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                            Estimated Duration
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-white/60 text-xs mb-1">Hours</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-white/60 text-xs mb-1">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    step="5"
                                    value={estimatedMinutes}
                                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
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

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface AddLongerTaskModalProps {
    isOpen: boolean;
    userId: string;
    editTask?: { id: string; title: string; description?: string; deadline?: string; estimatedHours?: number } | null;
    onClose: () => void;
    onSave: (task: { id?: string; user_id: string; title: string; description?: string; deadline?: string; estimatedHours?: number }) => Promise<void>;
}

const AddLongerTaskModal: React.FC<AddLongerTaskModalProps> = ({ isOpen, userId, editTask, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editTask) {
            setTitle(editTask.title);
            setDescription(editTask.description || '');
            setDeadline(editTask.deadline || '');
            setEstimatedHours(editTask.estimatedHours?.toString() || '');
        } else {
            setTitle('');
            setDescription('');
            setDeadline('');
            setEstimatedHours('');
        }
    }, [editTask, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }

        if (estimatedHours && (isNaN(Number(estimatedHours)) || Number(estimatedHours) <= 0)) {
            toast.error('Estimated hours must be a positive number');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                ...(editTask && { id: editTask.id }),
                user_id: userId,
                title: title.trim(),
                description: description.trim() || undefined,
                deadline: deadline || undefined,
                estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
            });

            toast.success(editTask ? 'Longer task updated!' : 'Longer task created!');
            setTitle('');
            setDescription('');
            setDeadline('');
            setEstimatedHours('');
            onClose();
        } catch (error) {
            toast.error(editTask ? 'Failed to update longer task' : 'Failed to create longer task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">flag</span>
                        {editTask ? 'Edit Longer Task' : 'Create Longer Task'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Complete React Course"
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add details about this long-term goal..."
                                rows={3}
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Target Deadline
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Estimated Total Hours
                            </label>
                            <input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                placeholder="e.g., 40"
                                min="0"
                                step="0.5"
                                className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                            />
                            <p className="text-white/40 text-xs mt-1">Total hours needed to complete this goal</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-surface-border hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-primary hover:brightness-110 rounded-xl text-black font-bold transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (editTask ? 'Updating...' : 'Creating...') : (editTask ? 'Update Task' : 'Create Task')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLongerTaskModal;

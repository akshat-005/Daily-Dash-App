import React, { useState, useEffect } from 'react';
import { LongerTask, Task } from '../../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface LongerTaskDetailsProps {
    task: LongerTask;
    onClose: () => void;
}

const LongerTaskDetails: React.FC<LongerTaskDetailsProps> = ({ task, onClose }) => {
    const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [estimatedHours, setEstimatedHours] = useState<number>(0);

    useEffect(() => {
        fetchLinkedTasks();
        fetchLongerTaskDetails();
    }, [task.id]);

    const fetchLongerTaskDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('estimated_hours')
                .eq('id', task.id)
                .single();

            if (error) throw error;
            setEstimatedHours(data?.estimated_hours || 0);
        } catch (error) {
            console.error('Error fetching longer task details:', error);
        }
    };

    const fetchLinkedTasks = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('long_task_id', task.id)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;

            const tasks = (data || []).map((t) => ({
                id: t.id,
                user_id: t.user_id,
                title: t.title,
                category: t.category,
                categoryColor: t.category_color,
                progress: t.progress,
                estimatedHours: t.estimated_hours,
                deadline: t.deadline,
                scheduled_date: t.scheduled_date,
                isCompleted: t.is_completed,
                completed_at: t.completed_at,
                created_at: t.created_at,
                updated_at: t.updated_at,
                long_task_id: t.long_task_id,
            })) as Task[];

            setLinkedTasks(tasks);
        } catch (error) {
            console.error('Error fetching linked tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const groupTasksByDate = () => {
        const grouped: Record<string, Task[]> = {};
        linkedTasks.forEach((task) => {
            const date = task.scheduled_date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(task);
        });
        return grouped;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, 'EEEE, MMM d, yyyy');
    };

    const groupedTasks = groupTasksByDate();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark border border-surface-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-surface-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-[28px]">flag</span>
                                <h2 className="text-2xl font-bold text-white">{task.title}</h2>
                            </div>
                            {task.description && (
                                <p className="text-white/60 text-sm">{task.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    // Trigger edit - we'll add this functionality
                                    const editEvent = new CustomEvent('editLongerTask', { detail: { task, estimatedHours } });
                                    window.dispatchEvent(editEvent);
                                    onClose();
                                }}
                                className="text-white/60 hover:text-primary transition-colors"
                                title="Edit"
                            >
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white/70 text-sm font-medium">Overall Progress</span>
                            <span className="text-primary text-lg font-bold">{task.progress}%</span>
                        </div>
                        <div className="h-3 bg-surface-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                        {task.deadline && (
                            <div className="flex items-center gap-2 text-white/60">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>Target: {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-white/60">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span>
                                {linkedTasks.reduce((sum, t) => sum + ((t.estimatedHours || 0) * (t.progress || 0) / 100), 0).toFixed(1)}h
                                {estimatedHours > 0 && ` / ${estimatedHours}h total`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Linked Tasks */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">link</span>
                        Linked Daily Tasks ({linkedTasks.length})
                    </h3>

                    {isLoading ? (
                        <div className="text-center py-8 text-white/50">
                            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                        </div>
                    ) : linkedTasks.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl mb-3 opacity-30 text-white">link_off</span>
                            <p className="text-white/50 text-sm">No daily tasks linked yet</p>
                            <p className="text-white/40 text-xs mt-1">Link daily tasks to track progress</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedTasks).map(([date, tasks]) => (
                                <div key={date}>
                                    <div className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">
                                        {formatDate(date)}
                                    </div>
                                    <div className="space-y-2">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="bg-[#111814] border border-surface-border rounded-xl p-3"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4 className={`text-white text-sm font-medium ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                                                            {task.title}
                                                        </h4>
                                                        <span className="text-xs text-white/40">{task.category}</span>
                                                    </div>
                                                    {task.isCompleted && (
                                                        <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-surface-border rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-primary text-xs font-bold">{task.progress}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-surface-border">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary hover:brightness-110 rounded-xl text-black font-bold transition-all shadow-glow"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LongerTaskDetails;

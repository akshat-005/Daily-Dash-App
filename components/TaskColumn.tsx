import React, { useState } from 'react';
import { Task, FilterType } from '../types';

const initialTasks: Task[] = [
    {
        id: '1',
        title: 'Strategic Planning',
        category: 'Deep Block 1',
        categoryColor: 'indigo',
        progress: 65,
        startTime: '8:00 AM',
        endTime: '10:00 AM',
        isCompleted: false
    },
    {
        id: '2',
        title: 'Review Q4 Reports',
        category: 'Light Task',
        categoryColor: 'primary',
        progress: 0,
        startTime: '10:30 AM',
        endTime: '11:30 AM',
        isCompleted: false
    },
    {
        id: '3',
        title: 'Morning Gym',
        category: 'Health',
        categoryColor: 'emerald',
        progress: 100,
        startTime: '7:45 AM',
        endTime: '',
        isCompleted: true
    },
    {
        id: '4',
        title: 'Brainstorm UI Concepts',
        category: 'Creative',
        categoryColor: 'purple',
        progress: 25,
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        isCompleted: false
    },
    {
        id: '5',
        title: 'Email Clearing',
        category: 'Admin',
        categoryColor: 'pink',
        progress: 10,
        startTime: '4:30 PM',
        endTime: '5:00 PM',
        isCompleted: false
    }
];

const TaskColumn: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [filter, setFilter] = useState<FilterType>('All Tasks');

    const handleProgressChange = (id: string, newProgress: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: newProgress } : t));
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
        return getColorClasses(color, true); // Fallback to solid color for others if no gradient defined
    };

    return (
        <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                {(['All Tasks', 'Deep Work', 'Meetings', 'Health'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                            filter === f 
                            ? 'bg-primary text-[#111814]' 
                            : 'bg-surface-dark border border-surface-border text-white font-medium hover:bg-surface-border'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            {tasks.map(task => {
                if (task.isCompleted) {
                    return (
                        <div key={task.id} className="group bg-surface-dark/60 border border-surface-border rounded-2xl p-5 shadow-card transition-all duration-300 opacity-80 hover:opacity-100">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                                        {task.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-white line-through decoration-emerald-500 decoration-2">{task.title}</h3>
                                </div>
                                <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-[#111814]">
                                    <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="relative w-full h-2 bg-surface-border rounded-full overflow-hidden">
                                    <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    <span>Completed at {task.startTime}</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={task.id} className="group bg-surface-dark hover:bg-[#202d26] border border-surface-border hover:border-primary/30 rounded-2xl p-5 shadow-card transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${getColorClasses(task.categoryColor)}`}>
                                    {task.category}
                                </span>
                                <h3 className="text-xl font-bold text-white">{task.title}</h3>
                            </div>
                            <button className="text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        
                        {/* Interactive Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs font-medium text-[#9db9a8] mb-2">
                                <span>Progress</span>
                                <span>{task.progress}%</span>
                            </div>
                            <div className="relative w-full h-2 bg-surface-border rounded-full overflow-hidden">
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
                                className="absolute left-0 w-full h-2 opacity-0 cursor-pointer -mt-2 z-10"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                            <div className="flex items-center gap-2 text-sm text-[#9db9a8]">
                                <span className="material-symbols-outlined text-base">schedule</span>
                                <span>{task.startTime} - {task.endTime}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="size-9 flex items-center justify-center rounded-full bg-surface-border hover:bg-surface-border/80 text-white transition-colors" title="Add Note">
                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                </button>
                                <button className="size-9 flex items-center justify-center rounded-full bg-surface-border hover:bg-surface-border/80 text-white transition-colors" title="Snooze">
                                    <span className="material-symbols-outlined text-[18px]">snooze</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TaskColumn;
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../src/contexts/AuthContext';
import { useTaskStore } from '../src/stores/taskStore';
import { useStatsStore } from '../src/stores/statsStore';
import MobileDateSelector from './MobileDateSelector';
import MobileMomentumCard from './MobileMomentumCard';
import MobileTodaysFocus from './MobileTodaysFocus';
import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import StatsColumn from './StatsColumn';
import TaskModal from '../src/components/TaskModal';
import { Task } from '../types';
import toast from 'react-hot-toast';

interface MobileViewProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ currentDate, onDateSelect }) => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'stats' | 'profile'>('dashboard');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const tasks = useTaskStore((state) => state.tasks);
    const createTask = useTaskStore((state) => state.createTask);
    const { signOut } = useAuth();

    const handleAddTask = () => {
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            await createTask(taskData);
            toast.success('Task created');
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    return (
        <div className="min-h-screen bg-[#111814] flex flex-col">
            {/* Header */}
            <div className="bg-[#111814] px-4 py-3 border-b border-[#2d4a38]">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">
                            {format(currentDate, 'EEEE, MMM d').toUpperCase()}
                        </p>
                        <h1 className="text-white text-xl font-bold">
                            Hi, {user?.email?.split('@')[0] || 'User'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="size-8 bg-[#1a2d23] rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[18px]">notifications</span>
                        </button>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="size-8 bg-primary rounded-full flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-black text-[18px]">person</span>
                        </button>
                    </div>
                </div>

                {/* Date Selector */}
                <MobileDateSelector currentDate={currentDate} onDateSelect={onDateSelect} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                {activeView === 'dashboard' && (
                    <>
                        <div className="py-4">
                            <MobileMomentumCard currentDate={currentDate} />
                        </div>
                        <MobileTodaysFocus currentDate={currentDate} />
                    </>
                )}

                {activeView === 'calendar' && (
                    <div className="p-4">
                        <Sidebar currentDate={currentDate} onDateSelect={onDateSelect} />
                    </div>
                )}

                {activeView === 'stats' && (
                    <div className="p-4">
                        <StatsColumn currentDate={currentDate} />
                    </div>
                )}

                {activeView === 'profile' && (
                    <div className="p-4">
                        <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-2xl p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="size-20 bg-primary rounded-full flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-black text-[40px]">person</span>
                                </div>
                                <h2 className="text-white text-xl font-bold mb-1">
                                    {user?.email?.split('@')[0] || 'User'}
                                </h2>
                                <p className="text-white/50 text-sm">{user?.email}</p>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-3 bg-[#111814] border border-[#2d4a38] rounded-xl text-white text-left px-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                        Settings
                                    </span>
                                    <span className="material-symbols-outlined text-white/30">chevron_right</span>
                                </button>

                                <button className="w-full py-3 bg-[#111814] border border-[#2d4a38] rounded-xl text-white text-left px-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                                    <span className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[20px]">help</span>
                                        Help & Support
                                    </span>
                                    <span className="material-symbols-outlined text-white/30">chevron_right</span>
                                </button>

                                <button
                                    onClick={handleSignOut}
                                    className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-left px-4 flex items-center gap-3 hover:bg-red-500/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <MobileBottomNav
                activeView={activeView}
                onNavigate={setActiveView}
                onAddTask={handleAddTask}
            />

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                task={null}
                currentDate={currentDate}
                userId={user!.id}
                existingCategories={Array.from(
                    new Map(tasks.map((t) => [t.category, { name: t.category, color: t.categoryColor }])).values()
                )}
                onSave={handleSaveTask}
                onClose={() => setIsTaskModalOpen(false)}
            />
        </div>
    );
};

export default MobileView;

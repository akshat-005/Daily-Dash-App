import React from 'react';
import { useTaskStore } from '../src/stores/taskStore';
import { useStatsStore } from '../src/stores/statsStore';

interface MobileMomentumCardProps {
    currentDate: Date;
}

const MobileMomentumCard: React.FC<MobileMomentumCardProps> = ({ currentDate }) => {
    const tasks = useTaskStore((state) => state.tasks);
    const dailyStats = useStatsStore((state) => state.dailyStats);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate change from previous day (mock for now, can be enhanced)
    const changePercentage = dailyStats?.daily_score ? Math.round(dailyStats.daily_score - 63) : 12;
    const isPositive = changePercentage >= 0;

    return (
        <div className="mx-4 bg-[#1a2d23] border border-[#2d4a38] rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/70 text-sm font-medium">Daily Momentum</h3>
                <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold ${isPositive ? 'text-primary' : 'text-red-400'}`}>
                        {isPositive ? '↗' : '↘'} {isPositive ? '+' : ''}{changePercentage}%
                    </span>
                </div>
            </div>

            <div className="mb-4">
                <h2 className="text-5xl font-black text-white mb-1">{completionPercentage}%</h2>
            </div>

            <div className="mb-3">
                <div className="w-full h-2 bg-[#28392f] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-white/50 text-xs">
                    {completedTasks} of {totalTasks} Habits Completed
                </span>
                <span className="text-primary text-xs font-bold">Keep it up!</span>
            </div>
        </div>
    );
};

export default MobileMomentumCard;

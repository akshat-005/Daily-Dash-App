import React from 'react';
import { useTaskStore } from '../src/stores/taskStore';
import { useStatsStore } from '../src/stores/statsStore';

interface MobileStatsCardsProps {
    currentDate: Date;
}

const MobileStatsCards: React.FC<MobileStatsCardsProps> = ({ currentDate }) => {
    const tasks = useTaskStore((state) => state.tasks);
    const dailyStats = useStatsStore((state) => state.dailyStats);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Daily score from stats
    const dailyScore = dailyStats?.daily_score || 0;

    return (
        <div className="mx-4 grid grid-cols-2 gap-3">
            {/* Doughnut Chart Card */}
            <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-2xl p-4 shadow-lg">
                <h3 className="text-white/70 text-xs font-medium mb-3">Tasks</h3>

                {/* Doughnut Chart */}
                <div className="flex items-center justify-center mb-3">
                    <div className="relative size-24">
                        {/* CSS Doughnut */}
                        <svg className="transform -rotate-90" width="96" height="96" viewBox="0 0 96 96">
                            {/* Background circle */}
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="#28392f"
                                strokeWidth="12"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="#2bee79"
                                strokeWidth="12"
                                strokeDasharray={`${completionPercentage * 2.51} 251`}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{completedTasks}</span>
                            <span className="text-[10px] text-white/50">of {totalTasks}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-primary"></div>
                            <span className="text-white/60">Done</span>
                        </div>
                        <span className="text-white font-medium">{completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-[#28392f]"></div>
                            <span className="text-white/60">Pending</span>
                        </div>
                        <span className="text-white font-medium">{pendingTasks}</span>
                    </div>
                </div>
            </div>

            {/* Daily Score Card */}
            <div className="bg-[#1a2d23] border border-[#2d4a38] rounded-2xl p-4 shadow-lg">
                <h3 className="text-white/70 text-xs font-medium mb-3">Daily Score</h3>

                <div className="flex flex-col items-center justify-center mb-3">
                    <div className="text-4xl font-black text-white mb-1">{dailyScore}</div>
                    <div className="text-xs text-white/50">out of 100</div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#28392f] rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${dailyScore}%` }}
                    />
                </div>

                {/* Status text */}
                <div className="text-center">
                    {dailyScore >= 80 && (
                        <span className="text-primary text-xs font-bold">Excellent! 🔥</span>
                    )}
                    {dailyScore >= 60 && dailyScore < 80 && (
                        <span className="text-emerald-400 text-xs font-bold">Great work! 💪</span>
                    )}
                    {dailyScore >= 40 && dailyScore < 60 && (
                        <span className="text-yellow-400 text-xs font-bold">Keep going! ⚡</span>
                    )}
                    {dailyScore < 40 && dailyScore > 0 && (
                        <span className="text-orange-400 text-xs font-bold">You got this! 🚀</span>
                    )}
                    {dailyScore === 0 && (
                        <span className="text-white/50 text-xs font-bold">Start your day! ✨</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileStatsCards;

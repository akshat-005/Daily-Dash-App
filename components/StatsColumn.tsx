import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useStatsStore } from '../src/stores/statsStore';
import { useTaskStore } from '../src/stores/taskStore';
import { formatDate } from '../src/utils/dateUtils';
import { calculateAndSaveDailyScore, updateStreak } from '../src/api/stats';
import LongerTasksList from '../src/components/LongerTasksList';
import toast from 'react-hot-toast';

interface StatsColumnProps {
    currentDate: Date;
}

const StatsColumn: React.FC<StatsColumnProps> = ({ currentDate }) => {
    const { user } = useAuth();
    const streak = useStatsStore((state) => state.streak);
    const dailyStats = useStatsStore((state) => state.dailyStats);
    const weeklyMomentum = useStatsStore((state) => state.weeklyMomentum);
    const tasks = useTaskStore((state) => state.tasks);
    const fetchStreak = useStatsStore((state) => state.fetchStreak);
    const fetchDailyStats = useStatsStore((state) => state.fetchDailyStats);

    const dailyScore = dailyStats?.daily_score || 0;
    const currentStreak = streak?.current_streak || 0;

    // Prepare weekly momentum data (last 7 days)
    const momentumData = Array(7).fill(0);
    weeklyMomentum.forEach((stat, index) => {
        if (index < 7) {
            momentumData[index] = stat.daily_score;
        }
    });

    // Fill remaining days with 0 if less than 7 days of data
    while (momentumData.length < 7) {
        momentumData.unshift(0);
    }

    return (
        <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Streak Card */}
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-4 shadow-card flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-orange-500/10 to-transparent"></div>
                <div>
                    <p className="text-[#9db9a8] text-xs font-medium mb-0.5">Current Streak</p>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                    </h2>
                </div>
                <div className="size-12 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🔥</span>
                </div>
            </div>

            {/* Daily Score & Momentum Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Daily Score */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl p-3 shadow-card flex flex-col items-center justify-center gap-2">
                    <div
                        className="relative size-16 rounded-full flex items-center justify-center"
                        style={{ background: `conic-gradient(#2bee79 ${dailyScore}%, #28392f 0)` }}
                    >
                        <div className="size-12 bg-surface-dark rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-base">{dailyScore}%</span>
                        </div>
                    </div>
                    <p className="text-xs font-medium text-[#9db9a8]">Daily Score</p>
                </div>

                {/* Weekly Momentum */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl p-3 shadow-card flex flex-col justify-between">
                    <div className="flex items-end justify-between h-16 gap-1">
                        {momentumData.map((score, index) => {
                            const isToday = index === momentumData.length - 1 && weeklyMomentum.length > 0;
                            const height = score > 0 ? `${Math.max(20, score)}%` : '20%';
                            const isFuture = index === momentumData.length - 1 && weeklyMomentum.length === 0;

                            return (
                                <div
                                    key={index}
                                    className={`w-full rounded-t-sm ${isToday
                                        ? 'bg-primary shadow-[0_0_8px_rgba(43,238,121,0.5)]'
                                        : isFuture
                                            ? 'bg-transparent border border-surface-border border-b-0 border-dashed'
                                            : 'bg-surface-border'
                                        }`}
                                    style={{ height }}
                                ></div>
                            );
                        })}
                    </div>
                    <p className="text-xs font-medium text-[#9db9a8] text-center mt-1.5">Momentum</p>
                </div>
            </div>

            {/* Longer Tasks */}
            <LongerTasksList />
        </div>
    );
};

export default StatsColumn;
import { Task } from '../../types';

interface ScoreInputs {
    tasksCompleted: number;
    tasksTotal: number;
    tasks: Task[];
    hasReflection: boolean;
}

export const calculateDailyScore = (inputs: ScoreInputs): number => {
    const { tasks } = inputs;

    if (tasks.length === 0) return 0;

    // Daily score is simply the average progress across all tasks
    // Example: [50, 80, 25, 100] → (50+80+25+100)/4 = 63.75 → 64%
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const avgProgress = totalProgress / tasks.length;

    return Math.round(avgProgress);
};

export const getProductivityLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
};

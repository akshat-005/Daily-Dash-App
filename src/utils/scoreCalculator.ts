import { Task } from '../../types';

interface ScoreInputs {
    tasksCompleted: number;
    tasksTotal: number;
    tasks: Task[];
    hasReflection: boolean;
}

export const calculateDailyScore = (inputs: ScoreInputs): number => {
    const { tasksCompleted, tasksTotal, tasks, hasReflection } = inputs;

    if (tasksTotal === 0) return 0;

    // Base score from completion rate (40% weight)
    const completionRate = tasksCompleted / tasksTotal;
    const completionScore = completionRate * 40;

    // Average progress score (40% weight)
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const avgProgress = tasks.length > 0 ? totalProgress / tasks.length : 0;
    const progressScore = (avgProgress / 100) * 40;

    // Reflection bonus (20% weight)
    const reflectionScore = hasReflection ? 20 : 0;

    const finalScore = Math.round(completionScore + progressScore + reflectionScore);
    return Math.min(100, Math.max(0, finalScore));
};

export const getProductivityLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
};

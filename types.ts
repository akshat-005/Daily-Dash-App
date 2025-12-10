export interface Task {
    id: string;
    title: string;
    category: string;
    categoryColor: 'indigo' | 'primary' | 'emerald' | 'purple' | 'pink';
    progress: number;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
}

export interface Day {
    day: number;
    status: 'high' | 'medium' | 'low' | 'none' | 'future';
    isToday: boolean;
}

export type FilterType = 'All Tasks' | 'Deep Work' | 'Meetings' | 'Health';

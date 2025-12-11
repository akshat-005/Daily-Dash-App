// Helper functions for linking daily tasks to longer tasks
import { useLongerTaskStore } from '../stores/longerTaskStore';
import { useTaskStore } from '../stores/taskStore';
import toast from 'react-hot-toast';

export const handleLinkChange = async (
    taskId: string,
    longerTaskId: string,
    linkToLongerTask: (dailyTaskId: string, longerTaskId: string | null) => Promise<void>,
    setPendingLinkTaskId: (id: string | null) => void,
    setIsLongerTaskModalOpen: (open: boolean) => void
) => {
    if (longerTaskId === 'create-new') {
        setPendingLinkTaskId(taskId);
        setIsLongerTaskModalOpen(true);
    } else if (longerTaskId === '') {
        try {
            await linkToLongerTask(taskId, null);
            toast.success('Task unlinked');
        } catch (error) {
            toast.error('Failed to unlink task');
        }
    } else {
        try {
            await linkToLongerTask(taskId, longerTaskId);
            toast.success('Task linked!');
        } catch (error) {
            toast.error('Failed to link task');
        }
    }
};

export const handleCreateAndLink = async (
    taskData: { user_id: string; title: string; description?: string; deadline?: string },
    pendingLinkTaskId: string | null,
    createLongerTask: (task: any) => Promise<void>,
    linkToLongerTask: (dailyTaskId: string, longerTaskId: string | null) => Promise<void>,
    setPendingLinkTaskId: (id: string | null) => void
) => {
    try {
        await createLongerTask(taskData);
        const newLongerTask = useLongerTaskStore.getState().longerTasks[0];
        if (pendingLinkTaskId && newLongerTask) {
            await linkToLongerTask(pendingLinkTaskId, newLongerTask.id);
            toast.success('Longer task created and linked!');
        }
        setPendingLinkTaskId(null);
    } catch (error) {
        toast.error('Failed to create longer task');
        throw error;
    }
};

export const getLongerTaskTitle = (longerTaskId?: string, longerTasks: any[] = []) => {
    if (!longerTaskId) return null;
    const longerTask = longerTasks.find(lt => lt.id === longerTaskId);
    return longerTask?.title || 'Unknown Task';
};

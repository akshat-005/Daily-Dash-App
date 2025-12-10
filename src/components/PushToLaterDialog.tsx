import React, { useState } from 'react';

interface PushToLaterDialogProps {
    isOpen: boolean;
    taskTitle: string;
    onConfirm: (newDate: Date) => void;
    onClose: () => void;
}

const PushToLaterDialog: React.FC<PushToLaterDialogProps> = ({
    isOpen,
    taskTitle,
    onConfirm,
    onClose,
}) => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    const handleConfirm = () => {
        const date = new Date(selectedDate);
        onConfirm(date);
        onClose();
    };

    if (!isOpen) return null;

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 max-w-md w-full shadow-card" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">schedule_send</span>
                    <h3 className="text-xl font-bold text-white">Push to Later</h3>
                </div>

                <p className="text-[#9db9a8] text-sm mb-4">
                    Reschedule "<span className="text-white font-medium">{taskTitle}</span>" to a future date.
                    All progress and details will be preserved.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#9db9a8] mb-2">
                        Select New Date
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        min={today}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-full bg-surface-border text-white font-medium hover:bg-[#3b5445] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-full bg-primary text-black font-bold hover:brightness-110 transition-all shadow-glow"
                    >
                        Push Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PushToLaterDialog;

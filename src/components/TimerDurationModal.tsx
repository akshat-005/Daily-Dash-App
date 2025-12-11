import React, { useState } from 'react';

interface TimerDurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (minutes: number) => void;
}

const TimerDurationModal: React.FC<TimerDurationModalProps> = ({ isOpen, onClose, onStart }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(25);

    const handlePreset = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        setHours(h);
        setMinutes(m);
    };

    const handleStart = () => {
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0) {
            onStart(totalMinutes);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a2d23] border border-surface-border rounded-3xl p-6 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[28px]">timer</span>
                        <h3 className="text-xl font-bold text-white">Set Timer Duration</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <p className="text-white/60 text-sm mb-6">How long would you like to work on this task?</p>

                {/* Hour and Minute Inputs */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Hours</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={hours}
                            onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                            className="w-full bg-[#111814] border border-surface-border rounded-2xl px-6 py-4 text-white text-center text-3xl font-bold focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Minutes</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutes}
                            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                            className="w-full bg-[#111814] border border-surface-border rounded-2xl px-6 py-4 text-white text-center text-3xl font-bold focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <button
                        onClick={() => handlePreset(15)}
                        className="py-2 px-3 bg-[#2d4a38] hover:bg-[#3d5a48] rounded-xl text-white/80 text-sm font-medium transition-colors"
                    >
                        15 min
                    </button>
                    <button
                        onClick={() => handlePreset(25)}
                        className="py-2 px-3 bg-[#2d4a38] hover:bg-[#3d5a48] rounded-xl text-white/80 text-sm font-medium transition-colors"
                    >
                        25 min
                    </button>
                    <button
                        onClick={() => handlePreset(45)}
                        className="py-2 px-3 bg-[#2d4a38] hover:bg-[#3d5a48] rounded-xl text-white/80 text-sm font-medium transition-colors"
                    >
                        45 min
                    </button>
                    <button
                        onClick={() => handlePreset(60)}
                        className="py-2 px-3 bg-[#2d4a38] hover:bg-[#3d5a48] rounded-xl text-white/80 text-sm font-medium transition-colors"
                    >
                        1 hour
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#2d4a38] hover:bg-[#3d5a48] rounded-2xl text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        className="flex-1 py-3 bg-primary hover:brightness-110 rounded-2xl text-black font-bold transition-all shadow-glow"
                    >
                        Start Timer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimerDurationModal;

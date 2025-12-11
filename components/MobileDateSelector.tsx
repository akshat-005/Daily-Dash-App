import React from 'react';
import { format, addDays } from 'date-fns';

interface MobileDateSelectorProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}

const MobileDateSelector: React.FC<MobileDateSelectorProps> = ({ currentDate, onDateSelect }) => {
    // Generate 7 days: 3 before, current, 3 after
    const days = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i - 3));

    const isCurrentDate = (date: Date) => {
        return format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
    };

    return (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2">
            {days.map((date, index) => {
                const isCurrent = isCurrentDate(date);
                const dayOfWeek = format(date, 'EEE').toUpperCase();
                const dayOfMonth = format(date, 'd');

                return (
                    <button
                        key={index}
                        onClick={() => onDateSelect(date)}
                        className={`flex flex-col items-center justify-center min-w-[50px] transition-all ${isCurrent
                                ? 'bg-primary text-black rounded-full px-3 py-2 shadow-glow'
                                : 'text-white/60 hover:text-white'
                            }`}
                    >
                        <span className={`text-[10px] font-medium mb-1 ${isCurrent ? 'text-black/70' : ''}`}>
                            {dayOfWeek}
                        </span>
                        <span className={`text-xl font-bold ${isCurrent ? 'text-black' : ''}`}>
                            {dayOfMonth}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileDateSelector;

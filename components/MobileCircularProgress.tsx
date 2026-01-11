// Temporary file to hold the MobileExpandableTaskCard component
// This will be integrated into MobileTodaysFocus.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';

interface CircularProgressProps {
    value: number;
    color: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, color, size = 'lg', showText = true }) => {
    const getColor = (c: string) => {
        if (c === 'primary') return '#4ade80';
        if (c === 'indigo') return '#818cf8';
        if (c === 'emerald') return '#22c55e';
        if (c === 'purple') return '#c084fc';
        if (c === 'pink') return '#f472b6';
        return '#9ca3af';
    };

    const sizeClasses = {
        sm: 'size-8 text-[10px]',
        md: 'size-10 text-xs',
        lg: 'size-12 text-sm'
    };

    return (
        <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
            <svg className="transform -rotate-90 size-full" viewBox="0 0 36 36">
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-white/5"
                />
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getColor(color)}
                    strokeWidth="4"
                    strokeDasharray="100, 100"
                    strokeDashoffset={100 - value}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {showText && (
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
                    {Math.round(value)}%
                </div>
            )}
        </div>
    );
};

export default CircularProgress;

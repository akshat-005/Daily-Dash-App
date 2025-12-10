import React from 'react';
import { Day } from '../types';

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Generating mock data for the calendar to match the image
const calendarDays: Day[] = [
    { day: 0, status: 'none', isToday: false }, // Empty
    { day: 0, status: 'none', isToday: false }, // Empty
    { day: 0, status: 'none', isToday: false }, // Empty
    { day: 1, status: 'high', isToday: false },
    { day: 2, status: 'high', isToday: false },
    { day: 3, status: 'medium', isToday: false },
    { day: 4, status: 'high', isToday: false },
    { day: 5, status: 'low', isToday: false },
    { day: 6, status: 'high', isToday: false },
    { day: 7, status: 'medium', isToday: false },
    { day: 8, status: 'high', isToday: false },
    { day: 9, status: 'high', isToday: false },
    { day: 10, status: 'high', isToday: false },
    { day: 11, status: 'medium', isToday: false },
    { day: 12, status: 'high', isToday: true }, // Today
    { day: 13, status: 'future', isToday: false },
    { day: 14, status: 'future', isToday: false },
    { day: 15, status: 'future', isToday: false },
    { day: 16, status: 'future', isToday: false },
    { day: 17, status: 'future', isToday: false },
];

const Sidebar: React.FC = () => {
  return (
    <div className="lg:col-span-3 flex flex-col gap-6">
      {/* Calendar Widget */}
      <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <span className="text-white font-bold text-lg">Calendar</span>
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-primary" title="High Productivity"></span>
            <span className="size-2 rounded-full bg-yellow-400" title="Medium Productivity"></span>
            <span className="size-2 rounded-full bg-red-400" title="Low Productivity"></span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-4 gap-x-1">
          {daysOfWeek.map((d, i) => (
            <span key={i} className="text-center text-xs font-bold text-[#9db9a8]">{d}</span>
          ))}
          
          {calendarDays.map((d, i) => {
             if (d.day === 0) return <span key={i}></span>;
             
             if (d.isToday) {
                 return (
                    <div key={i} className="flex flex-col items-center justify-center relative size-9 rounded-full bg-primary shadow-glow cursor-pointer">
                        <span className="text-sm font-bold text-black z-10">{d.day}</span>
                        <span className="absolute -bottom-1 size-1.5 rounded-full bg-black/40"></span>
                    </div>
                 );
             }

             let dotColor = 'bg-surface-border'; // future
             if (d.status === 'high') dotColor = 'bg-primary';
             if (d.status === 'medium') dotColor = 'bg-yellow-400';
             if (d.status === 'low') dotColor = 'bg-red-400';

             return (
                <div key={i} className={`flex flex-col items-center gap-1 group cursor-pointer ${d.status === 'future' ? 'opacity-50' : ''}`}>
                    <span className="text-sm font-medium text-white/60 group-hover:text-white">{d.day}</span>
                    <span className={`size-1.5 rounded-full ${dotColor}`}></span>
                </div>
             );
          })}
        </div>
      </div>

      {/* Motivation Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 p-6 text-white shadow-card">
        <img 
            className="absolute inset-0 w-full h-full object-cover opacity-30" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzWlWRUscb13ZeXieHtHxkWT1fdN4WcNbz-HDQVAkVZb83Vks68ZL01bYjoDz7gzSXykuqCdbf55j3yNT7ZfsSj6VbNKaqzt5m879AX2SE971JyMCY6bci3rqlYXr0FkAA_eqI25f9Z-nKG0GVdEDJWHZ3xBOtU5mlpzbSxLJtFjH0NFLOdTC1F6Y4hyRPaOxOI4MZLirqbcxXHan6nQzao-5jy6n6lsa-G71emYrCHEISI7rlRtvK7jjUCoA50KKwnzOukfAFc-Jt" 
            alt="Abstract background"
        />
        <div className="relative z-10">
            <span className="material-symbols-outlined mb-2 text-yellow-300">bolt</span>
            <h3 className="font-bold text-lg leading-tight mb-2">Focus on the process, not the outcome.</h3>
            <p className="text-sm opacity-80">You are doing great. Keep pushing forward one task at a time.</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
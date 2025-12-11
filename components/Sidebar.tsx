import React, { useEffect, useState } from 'react';
import { Day } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { formatDate, checkIsToday } from '../src/utils/dateUtils';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format } from 'date-fns';

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface SidebarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentDate, onDateSelect }) => {
  const { user, getUserDisplayName } = useAuth();
  const [calendarDays, setCalendarDays] = useState<Day[]>([]);

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, currentDate]);

  const loadCalendarData = async () => {
    if (!user) return;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch daily stats for the month
    const { data: stats } = await supabase
      .from('daily_stats')
      .select('stat_date, productivity_level')
      .eq('user_id', user.id)
      .gte('stat_date', formatDate(monthStart))
      .lte('stat_date', formatDate(monthEnd));

    const statsMap = new Map(
      (stats || []).map((s) => [s.stat_date, s.productivity_level])
    );

    // Add empty days at the start to align with the calendar
    const firstDayOfWeek = getDay(monthStart);
    const emptyDays: Day[] = Array(firstDayOfWeek).fill(null).map(() => ({
      day: 0,
      status: 'none',
      isToday: false,
    }));

    const today = new Date();
    const monthDays: Day[] = daysInMonth.map((date) => {
      const dateStr = formatDate(date);
      const productivity = statsMap.get(dateStr);
      const isFuture = date > today;

      return {
        day: date.getDate(),
        date: date,
        status: isFuture
          ? 'future'
          : productivity === 'high'
            ? 'high'
            : productivity === 'medium'
              ? 'medium'
              : productivity === 'low'
                ? 'low'
                : 'none',
        isToday: checkIsToday(date),
      } as Day;
    });

    setCalendarDays([...emptyDays, ...monthDays]);
  };

  return (
    <div className="lg:col-span-3 flex flex-col gap-4">
      {/* User Greeting */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </p>
        <h2 className="text-white text-2xl font-bold mb-1">
          Hi, {getUserDisplayName()}! 👋
        </h2>
        <p className="text-white/60 text-sm">
          Let's make today productive
        </p>
      </div>

      {/* Calendar Widget */}
      <div className="bg-surface-dark border border-surface-border rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-primary" title="High Productivity"></span>
            <span className="size-2 rounded-full bg-yellow-400" title="Medium Productivity"></span>
            <span className="size-2 rounded-full bg-red-400" title="Low Productivity"></span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1">
          {daysOfWeek.map((d, i) => (
            <span key={i} className="text-center text-xs font-bold text-[#9db9a8]">{d}</span>
          ))}

          {calendarDays.map((d, i) => {
            if (d.day === 0) return <span key={i}></span>;

            const isSelected = d.date && formatDate(d.date) === formatDate(currentDate);
            const isActualToday = d.isToday;

            // Selected date (where user is viewing)
            if (isSelected) {
              return (
                <div
                  key={i}
                  onClick={() => d.date && onDateSelect(d.date)}
                  className="flex flex-col items-center justify-center relative size-8 rounded-full bg-primary shadow-glow cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className="text-xs font-bold text-black z-10">{d.day}</span>
                  <span className="absolute -bottom-0.5 size-1 rounded-full bg-black/40"></span>
                </div>
              );
            }

            // Today's actual date (with ring outline)
            if (isActualToday) {
              return (
                <div
                  key={i}
                  onClick={() => d.date && onDateSelect(d.date)}
                  className="flex flex-col items-center justify-center relative size-8 rounded-full ring-2 ring-primary cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className="text-xs font-bold text-white z-10">{d.day}</span>
                </div>
              );
            }

            let dotColor = 'bg-surface-border';
            if (d.status === 'high') dotColor = 'bg-primary';
            if (d.status === 'medium') dotColor = 'bg-yellow-400';
            if (d.status === 'low') dotColor = 'bg-red-400';

            return (
              <div
                key={i}
                onClick={() => d.date && onDateSelect(d.date)}
                className={`flex flex-col items-center gap-0.5 group cursor-pointer ${d.status === 'future' ? 'opacity-50' : ''}`}
              >
                <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{d.day}</span>
                <span className={`size-1 rounded-full ${dotColor}`}></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivation Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 p-4 text-white shadow-card">
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzWlWRUscb13ZeXieHtHxkWT1fdN4WcNbz-HDQVAkVZb83Vks68ZL01bYjoDz7gzSXykuqCdbf55j3yNT7ZfsSj6VbNKaqzt5m879AX2SE971JyMCY6bci3rqlYXr0FkAA_eqI25f9Z-nKG0GVdEDJWHZ3xBOtU5mlpzbSxLJtFjH0NFLOdTC1F6Y4hyRPaOxOI4MZLirqbcxXHan6nQzao-5jy6n6lsa-G71emYrCHEISI7rlRtvK7jjUCoA50KKwnzOukfAFc-Jt"
          alt="Abstract background"
        />
        <div className="relative z-10">
          <span className="material-symbols-outlined mb-1.5 text-yellow-300 text-[20px]">bolt</span>
          <h3 className="font-bold text-base leading-tight mb-1.5">Focus on the process, not the outcome.</h3>
          <p className="text-xs opacity-80">You are doing great. Keep pushing forward one task at a time.</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
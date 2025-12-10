import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskColumn from './components/TaskColumn';
import StatsColumn from './components/StatsColumn';

const App: React.FC = () => {
  return (
    <>
      <Header />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Header Date Section */}
        <div className="flex flex-col items-center justify-center mb-10 text-center gap-2">
            <div className="flex items-center gap-4 bg-surface-dark border border-surface-border rounded-full p-1.5 pr-6 shadow-card hover:border-primary/50 transition-colors group">
                <button className="size-10 rounded-full bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="flex items-center gap-2 px-2 cursor-pointer">
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">calendar_today</span>
                    <h2 className="text-lg md:text-xl font-bold whitespace-nowrap">Monday, 12 December 2025</h2>
                </div>
                <button className="size-10 rounded-full bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
            <p className="text-[#9db9a8] text-sm md:text-base font-medium tracking-wide uppercase">Build Momentum Today</p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
            <Sidebar />
            <TaskColumn />
            <StatsColumn />
        </div>
      </main>
    </>
  );
};

export default App;
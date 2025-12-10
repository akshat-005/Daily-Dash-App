import React from 'react';

const StatsColumn: React.FC = () => {
    return (
        <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Streak Card */}
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-card flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-orange-500/10 to-transparent"></div>
                <div>
                    <p className="text-[#9db9a8] text-sm font-medium mb-1">Current Streak</p>
                    <h2 className="text-3xl font-black text-white tracking-tight">12 Days</h2>
                </div>
                <div className="size-14 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                    <span className="text-3xl">🔥</span>
                </div>
            </div>

            {/* Daily Score & Momentum Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Daily Score */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl p-4 shadow-card flex flex-col items-center justify-center gap-3">
                    <div 
                        className="relative size-20 rounded-full flex items-center justify-center"
                        style={{ background: 'conic-gradient(#2bee79 72%, #28392f 0)' }}
                    >
                        <div className="size-16 bg-surface-dark rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">72%</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-[#9db9a8]">Daily Score</p>
                </div>

                {/* Weekly Momentum */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl p-4 shadow-card flex flex-col justify-between">
                    <div className="flex items-end justify-between h-20 gap-1">
                        <div className="w-full bg-surface-border rounded-t-sm h-[40%]"></div>
                        <div className="w-full bg-surface-border rounded-t-sm h-[60%]"></div>
                        <div className="w-full bg-surface-border rounded-t-sm h-[30%]"></div>
                        <div className="w-full bg-surface-border rounded-t-sm h-[80%]"></div>
                        <div className="w-full bg-surface-border rounded-t-sm h-[50%]"></div>
                        <div className="w-full bg-primary rounded-t-sm h-[72%] shadow-[0_0_8px_rgba(43,238,121,0.5)]"></div>
                        <div className="w-full bg-transparent border border-surface-border border-b-0 border-dashed rounded-t-sm h-[20%]"></div>
                    </div>
                    <p className="text-sm font-medium text-[#9db9a8] text-center mt-2">Momentum</p>
                </div>
            </div>

            {/* Reflection Form */}
            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-card flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    <h3 className="text-lg font-bold text-white">Today's Reflection</h3>
                </div>
                <div className="flex flex-col gap-4 flex-1">
                    <div className="group">
                        <label className="block text-xs text-[#9db9a8] font-medium mb-1.5 ml-1">What went well?</label>
                        <input 
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/20" 
                            placeholder="Focus block was solid..." 
                            type="text"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-xs text-[#9db9a8] font-medium mb-1.5 ml-1">What needs improvement?</label>
                        <input 
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-white/20" 
                            placeholder="Avoid social media..." 
                            type="text"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-xs text-[#9db9a8] font-medium mb-1.5 ml-1">Plan for tomorrow?</label>
                        <textarea 
                            className="w-full bg-[#111814] border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none placeholder:text-white/20" 
                            placeholder="Start with the hardest task..." 
                            rows={3}
                        ></textarea>
                    </div>
                </div>
                <button className="mt-4 w-full py-3 rounded-full bg-surface-border text-white font-bold text-sm hover:bg-primary hover:text-black transition-colors">
                    Save Reflection
                </button>
            </div>
        </div>
    );
};

export default StatsColumn;
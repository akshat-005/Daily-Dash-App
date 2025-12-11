import React from 'react';

interface MobileBottomNavProps {
    activeView: 'dashboard' | 'calendar' | 'stats' | 'profile';
    onNavigate: (view: 'dashboard' | 'calendar' | 'stats' | 'profile') => void;
    onAddTask: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onNavigate, onAddTask }) => {
    const navItems = [
        { id: 'dashboard' as const, icon: 'grid_view', label: 'Dashboard' },
        { id: 'calendar' as const, icon: 'calendar_month', label: 'Calendar' },
        { id: 'add' as const, icon: 'add', label: 'Add' },
        { id: 'stats' as const, icon: 'bar_chart', label: 'Stats' },
        { id: 'profile' as const, icon: 'person', label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a2d23] border-t border-[#2d4a38] px-6 py-3 flex items-center justify-between z-50">
            {navItems.map((item) => {
                if (item.id === 'add') {
                    return (
                        <button
                            key={item.id}
                            onClick={onAddTask}
                            className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-glow hover:brightness-110 transition-all -mt-6"
                        >
                            <span className="material-symbols-outlined text-black text-[28px] font-bold">
                                {item.icon}
                            </span>
                        </button>
                    );
                }

                const isActive = activeView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;

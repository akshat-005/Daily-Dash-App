import React from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useStatsStore } from '../src/stores/statsStore';
import { useRevisitStore } from '../src/stores/revisitStore';

export type DesktopView = 'dashboard' | 'calendar' | 'revisits' | 'stats';

interface DesktopSidebarNavProps {
    activeView: DesktopView;
    onNavigate: (view: DesktopView) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const DesktopSidebarNav: React.FC<DesktopSidebarNavProps> = ({
    activeView,
    onNavigate,
    isCollapsed,
    onToggleCollapse
}) => {
    const { user, getUserDisplayName, signOut } = useAuth();
    const streak = useStatsStore((state) => state.streak);
    const todayRevisits = useRevisitStore((state) => state.todayRevisits);

    const navItems = [
        { id: 'dashboard' as const, icon: 'grid_view', label: 'Dashboard' },
        { id: 'calendar' as const, icon: 'calendar_month', label: 'Calendar' },
        { id: 'stats' as const, icon: 'bar_chart', label: 'Statistics' },
        { id: 'revisits' as const, icon: 'bookmark', label: 'Revisits', badge: todayRevisits.length || undefined },
    ];

    return (
        <div
            className={`bg-[#0f1612] border-r border-surface-border h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo & Toggle */}
            <div className="p-3 border-b border-surface-border">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="size-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-black text-[20px]">bolt</span>
                            </div>
                            <div className="overflow-hidden">
                                <h1 className="text-white font-bold text-base">DailyDash</h1>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className={`size-9 rounded-xl bg-surface-dark border border-surface-border flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all ${isCollapsed ? 'mx-auto' : ''
                            }`}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <span className="material-symbols-outlined text-white/60 text-[18px]">
                            {isCollapsed ? 'menu' : 'menu_open'}
                        </span>
                    </button>
                </div>
            </div>

            {/* User Info */}
            <div className={`p-3 border-b border-surface-border ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div className="size-9 bg-primary/20 rounded-full flex items-center justify-center relative group">
                        <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                        <div className="absolute -right-1 -bottom-1 size-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{streak?.current_streak || 0}</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a2d23] border border-surface-border rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {getUserDisplayName()}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="size-9 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-white font-semibold text-sm truncate">{getUserDisplayName()}</p>
                            <p className="text-white/40 text-xs truncate">{user?.email}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-orange-500/20 rounded-full px-2 py-1 shrink-0">
                            <span className="text-sm">🔥</span>
                            <span className="text-orange-400 text-xs font-bold">{streak?.current_streak || 0}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {!isCollapsed && (
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Menu</p>
                )}
                {navItems.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isCollapsed ? 'justify-center' : ''
                                } ${isActive
                                    ? 'bg-primary text-black font-semibold'
                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${isActive ? '' : 'group-hover:text-primary'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left text-sm">{item.label}</span>
                                    {item.badge && item.badge > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-black/20 text-black' : 'bg-primary/20 text-primary'
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {/* Badge for collapsed state */}
                            {isCollapsed && item.badge && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 size-4 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-black">
                                    {item.badge}
                                </span>
                            )}
                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a2d23] border border-surface-border rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}

            </nav>

            {/* Bottom Section */}
            <div className="p-2 border-t border-surface-border space-y-1">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group relative ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={isCollapsed ? 'Settings' : undefined}
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    {!isCollapsed && <span className="flex-1 text-left text-sm">Settings</span>}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a2d23] border border-surface-border rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Settings
                        </div>
                    )}
                </button>
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all group relative ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={isCollapsed ? 'Sign Out' : undefined}
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    {!isCollapsed && <span className="flex-1 text-left text-sm">Sign Out</span>}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a2d23] border border-surface-border rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Sign Out
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DesktopSidebarNav;

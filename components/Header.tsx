import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useStatsStore } from '../src/stores/statsStore';
import UserSettingsModal from './UserSettingsModal';
import NotificationsPanel from './NotificationsPanel';
import { useClickOutside } from '../src/utils/useClickOutside';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { user, signOut, getUserDisplayName } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const streak = useStatsStore((state) => state.streak);
  const fetchStreak = useStatsStore((state) => state.fetchStreak);

  // Refs for click-outside detection
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useClickOutside(profileMenuRef, () => setShowProfileMenu(false), showProfileMenu);
  useClickOutside(notificationsRef, () => setShowNotifications(false), showNotifications);

  useEffect(() => {
    if (user) {
      fetchStreak(user.id);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-surface-border px-4 py-2.5 sticky top-0 z-50 bg-[#111814]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img
            src="/logo-192.png"
            alt="DailyDash Logo"
            className="size-10 object-contain"
          />
          <h1 className="text-white text-lg font-bold tracking-tight">
            Daily<span className="text-primary">Dash</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak Indicator with Glow */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-lg shadow-orange-500/20">
            <div className="relative">
              <span className="text-2xl animate-pulse">🔥</span>
              <div className="absolute inset-0 blur-md bg-orange-500/40 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight">
                {streak?.current_streak || 0}
              </span>
              <span className="text-white/60 text-[10px] leading-tight">days</span>
            </div>
          </div>

          {/* Notifications Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-center rounded-full size-9 bg-surface-border text-white hover:bg-primary hover:text-black transition-colors relative"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 size-1.5 bg-red-500 rounded-full border border-[#111814]"></span>
            </button>

            <NotificationsPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User Profile Button */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="hidden md:flex items-center gap-2 rounded-full h-9 pl-1 pr-3 bg-primary text-[#111814] font-bold text-xs hover:brightness-110 transition-all shadow-glow"
            >
              <div className="size-7 rounded-full bg-black/10 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-white">person</span>
              </div>
              <span>{getUserDisplayName()}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-surface-border rounded-xl shadow-card overflow-hidden">
                <div className="p-3 border-b border-surface-border">
                  <p className="text-white text-sm font-medium truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-surface-border transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-surface-border transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default Header;
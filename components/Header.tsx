import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-surface-border px-4 py-2.5 sticky top-0 z-50 bg-[#111814]/90 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="size-7 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
        </div>
        <h1 className="text-white text-lg font-bold tracking-tight">
          Daily<span className="text-primary">Dash</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center rounded-full size-9 bg-surface-border text-white hover:bg-primary hover:text-black transition-colors">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
        <button className="flex items-center justify-center rounded-full size-9 bg-surface-border text-white hover:bg-primary hover:text-black transition-colors relative">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-1.5 bg-red-500 rounded-full border border-[#111814]"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="hidden md:flex items-center gap-2 rounded-full h-9 pl-1 pr-3 bg-primary text-[#111814] font-bold text-xs hover:brightness-110 transition-all shadow-glow"
          >
            <div className="size-7 rounded-full bg-black/10 flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-white">person</span>
            </div>
            <span>{user?.email?.split('@')[0] || 'Profile'}</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div className="p-3 border-b border-surface-border">
                <p className="text-white text-sm font-medium truncate">{user?.email}</p>
              </div>
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
  );
};

export default Header;
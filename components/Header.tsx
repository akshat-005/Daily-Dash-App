import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-6 py-4 sticky top-0 z-50 bg-[#111814]/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="size-8 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">dashboard</span>
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight">
          Daily<span className="text-primary">Dash</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center justify-center rounded-full size-10 bg-surface-border text-white hover:bg-primary hover:text-black transition-colors">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>
        <button className="flex items-center justify-center rounded-full size-10 bg-surface-border text-white hover:bg-primary hover:text-black transition-colors relative">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-[#111814]"></span>
        </button>
        <button className="hidden md:flex items-center gap-2 rounded-full h-10 pl-1 pr-4 bg-primary text-[#111814] font-bold text-sm hover:brightness-110 transition-all shadow-glow">
          <div className="size-8 rounded-full bg-black/10 flex items-center justify-center overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkWz9XJCT4mf2lbn7l6BAIf3wgFEd-RXjCYZ-ROweKk00lNCOP8o1PAqHjt3rAo1cenEOM_Cu1M3L9rQeueo_bDPEi9jN7J4mq0YIsOty_OUUxaUeyoUwY3efmlmvT6SZCKXEK8KnQc4geufYmD2IZRjLoC95NolDZt_2fwyd2zneqxNOsQH6SqnnRC6-IbEMrMkcKZ1IKFr8Gi-Yz4wJVz3FqHL-GKazb-vWgLD_YhTCLOKiNfcZVO8pbcN-5j6nfTkoxCM2JqfKC" 
              alt="User profile"
            />
          </div>
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
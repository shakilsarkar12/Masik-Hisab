import React from 'react';
import { Calendar, Bell, Menu } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const Navbar = ({ title, onMenuClick }) => {
  const { user } = useUser();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-8">
      {/* Left Menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight">{title}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Welcome back, {user?.firstName || 'User'}!</p>
        </div>
      </div>

      {/* Date & Icons */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date display */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-xl text-slate-300 text-sm font-medium">
          <Calendar size={16} className="text-sky-400" />
          <span>{today}</span>
        </div>

        {/* Notifications mock icon */}
        <div className="relative p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 cursor-pointer transition text-slate-400 hover:text-slate-200">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500"></span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

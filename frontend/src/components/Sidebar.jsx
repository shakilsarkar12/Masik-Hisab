import React from 'react';
import Logo from '../../public/logo.png';
import { NavLink } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useUser();

  const links = [
    { to: '/', label: 'Overview', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/income', label: 'Incomes', icon: <TrendingUp size={20} /> },
    { to: '/expenses', label: 'Expenses', icon: <TrendingDown size={20} /> },
    { to: '/budgets', label: 'Budgets', icon: <PiggyBank size={20} /> },
    { to: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <aside className={`w-64 h-screen fixed top-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-30 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Header */}
      <div className="p-6 relative">
        {/* Close Drawer Button for mobile */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition border border-slate-800 cursor-pointer"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
        <img className='h-20 mx-auto' src={Logo} alt="masik hisab logo" />
        <p className="text-xs text-slate-500 mt-1 font-medium text-center">Personal Finance Dashboard</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose} // Auto close drawer on navigation click (mobile)
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                ? 'bg-sky-500/10 text-sky-400 border-l-4 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Session Details & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2">
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-10 h-10 border-2 border-sky-500/50 shadow-md",
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.firstName || user?.fullName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress || 'User'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

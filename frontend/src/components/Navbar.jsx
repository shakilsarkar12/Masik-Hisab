import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Bell, Menu, X, Settings, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { notificationAPI } from '../services/api';
import NotificationSettingsModal from './NotificationSettingsModal';

const Navbar = ({ title, onMenuClick }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds for dynamic feel
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'danger':
        return (
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertCircle size={16} />
          </div>
        );
      case 'warning':
        return (
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle size={16} />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Info size={16} />
          </div>
        );
    }
  };

  return (
    <>
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

          {/* Notifications Dropdown wrapper */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`relative p-2 rounded-xl border transition cursor-pointer ${
                dropdownOpen 
                  ? 'bg-slate-800 border-slate-700 text-slate-100' 
                  : 'bg-slate-800/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              aria-label="Toggle notifications menu"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl border border-slate-800 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Panel Body */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-850">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs text-slate-500 font-medium">No notifications yet.</p>
                      <p className="text-[10px] text-slate-600">We'll alert you for budget status overruns!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`p-4 transition flex items-start gap-3 hover:bg-slate-900/20 relative group ${
                          !notif.read ? 'bg-sky-500/[0.02]' : ''
                        }`}
                      >
                        {getNotificationIcon(notif.type)}
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={`text-xs font-semibold leading-relaxed ${!notif.read ? 'text-slate-100' : 'text-slate-400'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-600 block mt-1.5 font-medium">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Read action toggle button */}
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkRead(notif._id, e)}
                            className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-850 hover:bg-slate-850 text-slate-400 hover:text-sky-400 transition cursor-pointer"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Panel Footer */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-center">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <Settings size={13} className="text-slate-500" />
                    Configure Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  );
};

export default Navbar;

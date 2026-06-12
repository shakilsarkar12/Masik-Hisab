import React, { useState, useEffect } from 'react';
import { X, Mail, Bell, AlertTriangle, Clock, Save } from 'lucide-react';
import { notificationAPI } from '../services/api';

const NotificationSettingsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState('20:00');
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationAPI.getSettings();
      const settings = res.data;
      
      setEmailEnabled(settings.emailNotificationsEnabled);
      setDailyReminderEnabled(settings.dailyReminderEnabled);
      setDailyReminderTime(settings.dailyReminderTime);
      setBudgetAlertsEnabled(settings.budgetAlertsEnabled);
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await notificationAPI.updateSettings({
        emailNotificationsEnabled: emailEnabled,
        dailyReminderEnabled: dailyReminderEnabled,
        dailyReminderTime,
        budgetAlertsEnabled: budgetAlertsEnabled
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="text-sky-400" size={22} />
            Notification Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1">Configure your email alerts and transaction reminders</p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="alert alert-error bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-center gap-2 text-xs mb-4">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center gap-2 text-xs mb-4">
            <Bell size={16} className="animate-bounce" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="loading loading-spinner loading-md text-sky-400"></span>
            <p className="text-xs text-slate-500">Loading preferences...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Master Email Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/30 border border-slate-850">
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Mail size={18} />
                </div>
                <div>
                  <label htmlFor="emailEnabled" className="text-sm font-semibold text-slate-200 block cursor-pointer">Email Notifications</label>
                  <span className="text-[10px] text-slate-500">Enable/Disable all email dispatches</span>
                </div>
              </div>
              <input
                id="emailEnabled"
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="toggle toggle-primary toggle-sm cursor-pointer"
              />
            </div>

            {/* Daily Entry Reminder Toggle */}
            <div className={`p-4 rounded-xl bg-slate-900/30 border border-slate-850 space-y-4 transition-opacity ${!emailEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <label htmlFor="dailyReminderEnabled" className="text-sm font-semibold text-slate-200 block cursor-pointer">Daily Reminder</label>
                    <span className="text-[10px] text-slate-500">Email alert if no transaction recorded today</span>
                  </div>
                </div>
                <input
                  id="dailyReminderEnabled"
                  type="checkbox"
                  disabled={!emailEnabled}
                  checked={dailyReminderEnabled}
                  onChange={(e) => setDailyReminderEnabled(e.target.checked)}
                  className="toggle toggle-warning toggle-sm cursor-pointer"
                />
              </div>

              {dailyReminderEnabled && (
                <div className="pl-11 pr-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label htmlFor="reminderTime" className="text-xs text-slate-400 font-medium block mb-1.5">Reminder Delivery Time</label>
                  <input
                    id="reminderTime"
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => setDailyReminderTime(e.target.value)}
                    className="input glass-input rounded-xl text-sm h-10 w-full text-slate-350"
                  />
                </div>
              )}
            </div>

            {/* Budget Alerts Toggle */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl bg-slate-900/30 border border-slate-850 transition-opacity ${!emailEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex gap-3 items-center">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <label htmlFor="budgetAlertsEnabled" className="text-sm font-semibold text-slate-200 block cursor-pointer">Budget Overrun Alerts</label>
                  <span className="text-[10px] text-slate-500">Instant email when limits are exceeded</span>
                </div>
              </div>
              <input
                id="budgetAlertsEnabled"
                type="checkbox"
                disabled={!emailEnabled}
                checked={budgetAlertsEnabled}
                onChange={(e) => setBudgetAlertsEnabled(e.target.checked)}
                className="toggle toggle-error toggle-sm cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-3 border-t border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-slate-800 hover:bg-slate-700 border-none text-slate-300 font-semibold rounded-xl text-xs px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl text-xs px-5 flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsModal;

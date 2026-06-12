import React from 'react';

const SummaryCard = ({ title, value, icon, color = 'sky' }) => {
  const colorSchemes = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'from-emerald-500/5 to-emerald-500/0',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      text: 'text-emerald-400'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bg: 'from-rose-500/5 to-rose-500/0',
      iconBg: 'bg-rose-500/10 text-rose-400',
      text: 'text-rose-400'
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-500/40',
      bg: 'from-sky-500/5 to-sky-500/0',
      iconBg: 'bg-sky-500/10 text-sky-400',
      text: 'text-sky-400'
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      bg: 'from-indigo-500/5 to-indigo-500/0',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      text: 'text-indigo-400'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.sky;

  return (
    <div className={`glass-card p-6 rounded-2xl border ${scheme.border} bg-gradient-to-br ${scheme.bg} relative overflow-hidden flex flex-col justify-between h-36`}>
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-100 mt-2 font-display">
            ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <span className={`${scheme.text} font-medium`}>Updated live</span>
      </div>
    </div>
  );
};

export default SummaryCard;

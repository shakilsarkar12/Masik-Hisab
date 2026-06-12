import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const savings = payload[0].value;
    return (
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-lg backdrop-blur-md">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-extrabold mt-1 ${savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          Savings: ${Number(savings).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const SavingsTrendChart = ({ data = [], loading = false }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col h-[340px]">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Savings Trend</h3>
        <p className="text-xs text-slate-500 mt-0.5">Net monthly savings trajectory</p>
      </div>

      <div className="flex-1 min-h-0 mt-4 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-sky-400"></span>
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <TrendingUp size={36} className="text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm font-medium">No history data available</p>
            <p className="text-slate-600 text-xs mt-1">Add transactions to start viewing your savings path</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SavingsTrendChart;

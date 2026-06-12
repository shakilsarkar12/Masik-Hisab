import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = [
  '#38bdf8', // Sky
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#84cc16'  // Lime
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-lg backdrop-blur-md">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{payload[0].name}</p>
        <p className="text-sm font-extrabold text-sky-400 mt-1">
          ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const ExpenseCategoryChart = ({ data = [], loading = false }) => {
  const hasData = data && data.length > 0 && data.some(item => item.value > 0);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col h-[340px]">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Expenses by Category</h3>
        <p className="text-xs text-slate-500 mt-0.5">Distribution of all-time expenses</p>
      </div>

      <div className="flex-1 min-h-0 mt-4 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-sky-400"></span>
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <BarChart3 size={36} className="text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm font-medium">No expense data available</p>
            <p className="text-slate-600 text-xs mt-1">Add expenses to visualize breakdown</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(15,23,42,0.5)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs font-medium text-slate-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoryChart;

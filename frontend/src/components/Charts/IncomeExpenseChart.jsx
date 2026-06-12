import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-md space-y-1">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        <div className="flex items-center gap-4 text-xs font-medium justify-between">
          <span className="text-emerald-400">Income:</span>
          <span className="text-slate-100 font-bold">${Number(payload[0]?.value ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium justify-between">
          <span className="text-rose-400">Expense:</span>
          <span className="text-slate-100 font-bold">${Number(payload[1]?.value ?? 0).toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const IncomeExpenseChart = ({ data = [], loading = false }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col h-[340px]">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Income vs Expenses</h3>
        <p className="text-xs text-slate-500 mt-0.5">Monthly cashflow comparison</p>
      </div>

      <div className="flex-1 min-h-0 mt-4 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-sky-400"></span>
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <BarChart3 size={36} className="text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm font-medium">No history data available</p>
            <p className="text-slate-600 text-xs mt-1">Record incomes and expenses to see comparative bars</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              <Legend 
                verticalAlign="top"
                align="right"
                height={30}
                iconType="circle"
                iconSize={6}
                formatter={(value) => <span className="text-xs font-semibold text-slate-400 capitalize">{value}</span>}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} name="income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} name="expense" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseChart;

import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Wallet, ShoppingBag, Search, Calendar, Filter } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Internet', 'Mobile Recharge',
  'Shopping', 'Entertainment', 'Medical', 'Family', 'Others'
];

const RecentTransactions = ({ refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');

  const fetchFilteredTransactions = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getTransactions(search, month, category, type);
      // If no filters are active, we limit the display to the 10 most recent
      const isFilterActive = search || type || category || month;
      const data = isFilterActive ? res.data : res.data.slice(0, 10);
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredTransactions();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, type, category, month, refreshTrigger]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Transaction History & search</h3>
          <p className="text-xs text-slate-500 mt-0.5">Filter, search and review all income and expenses</p>
        </div>

        {/* Quick Clear filter if any */}
        {(search || type || category || month) && (
          <button
            onClick={() => {
              setSearch('');
              setType('');
              setCategory('');
              setMonth('');
            }}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline decoration-dotted"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Inputs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-850">

        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-8 glass-input rounded-lg text-xs h-9"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value === 'Income') setCategory(''); // Incomes don't have categories
            }}
            className="select pl-3 glass-input rounded-lg text-xs h-9 w-full text-slate-400"
          >
            <option value="">All Types</option>
            <option value="Income">Incomes</option>
            <option value="Expense">Expenses</option>
          </select>
        </div>

        {/* Category Filter - only enabled if Type is not Income */}
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={type === 'Income'}
            className="select pl-3 glass-input rounded-lg text-xs h-9 w-full text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input pl-3 glass-input rounded-lg text-xs h-9 w-full text-slate-400"
          />
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4 py-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/30 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900"></div>
                <div className="space-y-2">
                  <div className="h-3.5 w-24 bg-slate-900 rounded"></div>
                  <div className="h-3 w-16 bg-slate-900 rounded"></div>
                </div>
              </div>
              <div className="h-3.5 w-10 bg-slate-900 rounded"></div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm font-medium">No transactions found matching the active filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
          <table className="table w-full text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 bg-slate-950/20 backdrop-blur-md">
                <th className="bg-transparent pl-2 py-2.5 text-left">Transaction</th>
                <th className="bg-transparent py-2.5 text-left hidden sm:table-cell">Category / Source</th>
                <th className="bg-transparent py-2.5 text-left hidden sm:table-cell">Date</th>
                <th className="bg-transparent pr-2 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'Income';
                return (
                  <tr key={tx._id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="bg-transparent pl-2 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${isIncome
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {isIncome ? 'Income' : 'Expense'}
                          </p>
                          {tx.noteOrDesc && (
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[110px] sm:max-w-[140px]">
                              {tx.noteOrDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="bg-transparent py-3 align-middle text-xs hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${isIncome
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/30'
                        }`}>
                        {isIncome ? <Wallet size={10} /> : <ShoppingBag size={10} />}
                        {tx.categoryOrSource}
                      </span>
                    </td>
                    <td className="bg-transparent py-3 text-xs text-slate-500 align-middle hidden sm:table-cell">
                      {formatDate(tx.date)}
                    </td>
                    <td className="bg-transparent pr-2 py-3 text-right align-middle">
                      <span className={`text-xs font-bold font-display ${isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer item showing counts */}
      {!loading && transactions.length > 0 && (
        <div className="text-[10px] text-slate-600 font-semibold text-right pr-2">
          Displaying {transactions.length} record{transactions.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;

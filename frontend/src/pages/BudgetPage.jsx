import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import { budgetAPI } from '../services/api';
import { Settings, Plus, Calendar, AlertTriangle, CheckCircle, Percent, PiggyBank } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Internet', 'Mobile Recharge', 
  'Shopping', 'Entertainment', 'Medical', 'Family', 'Others'
];

const BudgetPage = () => {
  const [loading, setLoading] = useState(true);
  const [budgetList, setBudgetList] = useState([]);
  const [alert, setAlert] = useState(null);

  // Month & Year Filter for Budget Status
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [monthYearVal, setMonthYearVal] = useState(`${currentYear}-${currentMonth}`);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      category: 'Food',
      budgetAmount: '',
      monthYear: `${currentYear}-${currentMonth}`
    }
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchBudgetStatus = async () => {
    try {
      setLoading(true);
      const [year, month] = monthYearVal.split('-').map(Number);
      const res = await budgetAPI.getMonthlyStatus(month, year);
      setBudgetList(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to retrieve monthly budget status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetStatus();
  }, [monthYearVal]);

  const onSetBudget = async (data) => {
    try {
      const [year, month] = data.monthYear.split('-').map(Number);
      await budgetAPI.upsert({
        category: data.category,
        budgetAmount: Number(data.budgetAmount),
        month,
        year
      });
      showAlert('success', `Budget for ${data.category} updated successfully.`);
      reset({
        category: data.category,
        budgetAmount: '',
        monthYear: data.monthYear
      });
      // Refresh current month's view
      if (data.monthYear === monthYearVal) {
        fetchBudgetStatus();
      } else {
        setMonthYearVal(data.monthYear);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to update budget.');
    }
  };

  return (
    <Layout title="Budget Planner">
      {/* Toast Alert */}
      {alert && (
        <div className={`fixed bottom-6 right-6 z-50 alert ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        } w-96 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Set Budget Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Settings size={20} className="text-sky-400" />
              Configure Budget
            </h3>
            <p className="text-xs text-slate-500 mt-1">Define monthly limits for specific categories</p>
          </div>

          <form onSubmit={handleSubmit(onSetBudget)} className="space-y-4">
            <div className="form-control">
              <label className="label text-slate-400 text-xs font-semibold mb-1">Target Month</label>
              <input
                type="month"
                className={`input w-full glass-input rounded-xl text-sm ${errors.monthYear ? 'border-rose-500/50' : ''}`}
                {...register('monthYear', { required: 'Month and Year are required' })}
              />
              {errors.monthYear && <span className="text-rose-400 text-xs mt-1">{errors.monthYear.message}</span>}
            </div>

            <div className="form-control">
              <label className="label text-slate-400 text-xs font-semibold mb-1">Category</label>
              <select
                className="select w-full glass-input rounded-xl text-sm"
                {...register('category', { required: 'Category is required' })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label text-slate-400 text-xs font-semibold mb-1">Limit Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 500.00"
                className={`input w-full glass-input rounded-xl text-sm ${errors.budgetAmount ? 'border-rose-500/50' : ''}`}
                {...register('budgetAmount', { 
                  required: 'Budget amount is required',
                  min: { value: 0, message: 'Amount cannot be negative' }
                })}
              />
              {errors.budgetAmount && <span className="text-rose-400 text-xs mt-1">{errors.budgetAmount.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl h-11 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/10 mt-6 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <Plus size={16} />
                  Save Limit
                </>
              )}
            </button>
          </form>
        </div>

        {/* Budget Status View */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Monthly Budgets Overview</h3>
              <p className="text-xs text-slate-500 mt-1">Comparing budget allocations vs actual expenses</p>
            </div>

            <div className="relative">
              <input
                type="month"
                value={monthYearVal}
                onChange={(e) => setMonthYearVal(e.target.value)}
                className="input pl-4 glass-input rounded-xl text-sm h-11 text-slate-300 w-full sm:w-48"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <span className="loading loading-spinner loading-lg text-sky-400"></span>
            </div>
          ) : (
            <div className="space-y-5">
              {budgetList.map((item) => {
                const percent = item.budgetAmount > 0 
                  ? Math.min(100, Math.round((item.actualAmount / item.budgetAmount) * 100))
                  : 0;

                const isExceeded = item.exceeded;
                const isConfigured = item.budgetAmount > 0;

                return (
                  <div key={item.category} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{item.category}</span>
                        {isExceeded && (
                          <span className="badge bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold text-[10px] uppercase py-1.5 px-2 flex items-center gap-1">
                            <AlertTriangle size={10} /> Over Budget
                          </span>
                        )}
                        {!isConfigured && (
                          <span className="badge bg-slate-800 border-none text-slate-500 text-[10px] uppercase py-1.5 px-2">
                            Not Configured
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400">
                          ${item.actualAmount.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-600 font-medium"> of </span>
                        <span className="text-xs font-bold text-slate-300">
                          ${item.budgetAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isConfigured && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-850">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isExceeded 
                                ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                                : percent > 80
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-emerald-400 to-sky-400'
                            }`}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>{percent}% Used</span>
                          {isExceeded ? (
                            <span className="text-rose-400 font-semibold">Overrun by ${Math.abs(item.difference).toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">${item.difference.toFixed(2)} remaining</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BudgetPage;

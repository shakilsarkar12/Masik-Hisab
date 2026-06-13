import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { X, AlertTriangle } from 'lucide-react';
import { expenseAPI, budgetAPI } from '../services/api';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Internet', 'Mobile Recharge', 
  'Shopping', 'Entertainment', 'Medical', 'Family', 'Others'
];

const AddExpenseModal = ({ isOpen, onClose, onSuccess, showAlert }) => {
  const [monthlyBudgets, setMonthlyBudgets] = useState([]);
  const [budgetCheckMessage, setBudgetCheckMessage] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  });

  const amount = useWatch({ control, name: 'amount' });
  const category = useWatch({ control, name: 'category' });
  const date = useWatch({ control, name: 'date' });

  const loadBudgetStatuses = async (dateStr) => {
    if (!dateStr) return;
    try {
      const d = new Date(dateStr);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const res = await budgetAPI.getMonthlyStatus(m, y);
      setMonthlyBudgets(res.data);
    } catch (err) {
      console.error("Error fetching budget statuses:", err);
    }
  };

  useEffect(() => {
    if (isOpen && date) {
      loadBudgetStatuses(date);
    }
  }, [date, isOpen]);

  useEffect(() => {
    if (!isOpen || !amount || !category || monthlyBudgets.length === 0) {
      setBudgetCheckMessage(null);
      return;
    }

    const budgetItem = monthlyBudgets.find(b => b.category === category);
    if (budgetItem && budgetItem.budgetAmount > 0) {
      const newTotal = budgetItem.actualAmount + Number(amount);
      if (newTotal > budgetItem.budgetAmount) {
        const exceededBy = newTotal - budgetItem.budgetAmount;
        setBudgetCheckMessage({
          budget: budgetItem.budgetAmount,
          actual: budgetItem.actualAmount,
          projected: newTotal,
          exceededBy,
          category: category
        });
        return;
      }
    }
    setBudgetCheckMessage(null);
  }, [amount, category, monthlyBudgets, isOpen]);

  const onSubmit = async (data) => {
    try {
      await expenseAPI.create({
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: data.date
      });
      showAlert('success', 'Expense entry added successfully.');
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add expense.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-slate-100 mb-6">Add New Expense</h3>

        {budgetCheckMessage && (
          <div className="alert alert-warning bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-4 text-xs leading-relaxed animate-in fade-in duration-150">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-amber-300">⚠️ Monthly Budget Limit Alert!</p>
              <p className="mt-1">
                Your budget for <strong className="text-white">{budgetCheckMessage.category}</strong> is <strong className="text-white">${budgetCheckMessage.budget}</strong>. 
                Adding this expense of <strong className="text-white">${amount}</strong> will make your total monthly spending <strong className="text-white">${budgetCheckMessage.projected.toFixed(2)}</strong>, exceeding the budget by <strong className="text-rose-400 font-bold">${budgetCheckMessage.exceededBy.toFixed(2)}</strong>!
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <label className="label text-slate-400 text-xs font-semibold mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className={`input w-full glass-input rounded-xl text-sm ${errors.amount ? 'border-rose-500/50' : ''}`}
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than zero' }
              })}
            />
            {errors.amount && <span className="text-rose-400 text-xs mt-1">{errors.amount.message}</span>}
          </div>

          <div className="form-control">
            <label className="label text-slate-400 text-xs font-semibold mb-1">Date</label>
            <input
              type="date"
              className={`input w-full glass-input rounded-xl text-sm ${errors.date ? 'border-rose-500/50' : ''}`}
              {...register('date', { required: 'Date is required' })}
            />
            {errors.date && <span className="text-rose-400 text-xs mt-1">{errors.date.message}</span>}
          </div>

          <div className="form-control">
            <label className="label text-slate-400 text-xs font-semibold mb-1">Description (Optional)</label>
            <textarea
              placeholder="Additional details..."
              className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
              {...register('description')}
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-slate-800 hover:bg-slate-700 border-none text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-rose-500 hover:bg-rose-600 border-none text-white font-bold rounded-xl px-6"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;

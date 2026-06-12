import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Layout from '../components/Layout';
import { expenseAPI, budgetAPI } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Internet', 'Mobile Recharge', 
  'Shopping', 'Entertainment', 'Medical', 'Family', 'Others'
];

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Budget validation state inside modal
  const [monthlyBudgets, setMonthlyBudgets] = useState([]);
  const [budgetCheckMessage, setBudgetCheckMessage] = useState(null);

  // Add Form Setup
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, control: addControl, formState: { errors: addErrors } } = useForm({
    defaultValues: {
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  });

  // Edit Form Setup
  const { register: registerEdit, handleSubmit: handleEditSubmit, setValue: setEditValue, control: editControl, formState: { errors: editErrors } } = useForm();

  // Watch fields to trigger real-time budget warnings
  const addAmount = useWatch({ control: addControl, name: 'amount' });
  const addCategory = useWatch({ control: addControl, name: 'category' });
  const addDate = useWatch({ control: addControl, name: 'date' });

  const editAmount = useWatch({ control: editControl, name: 'amount' });
  const editCategory = useWatch({ control: editControl, name: 'category' });
  const editDate = useWatch({ control: editControl, name: 'date' });

  // Toast helper
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseAPI.getAll(search, categoryFilter, monthFilter);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load expense entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, categoryFilter, monthFilter]);

  // Load budget statuses for the chosen month
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

  // Trigger budget status fetch when date changes in Add Modal
  useEffect(() => {
    if (isAddOpen && addDate) {
      loadBudgetStatuses(addDate);
    }
  }, [addDate, isAddOpen]);

  // Trigger budget status fetch when date changes in Edit Modal
  useEffect(() => {
    if (isEditOpen && editDate) {
      loadBudgetStatuses(editDate);
    }
  }, [editDate, isEditOpen]);

  // Compute live warning for Add Modal
  useEffect(() => {
    if (!isAddOpen || !addAmount || !addCategory || monthlyBudgets.length === 0) {
      setBudgetCheckMessage(null);
      return;
    }

    const budgetItem = monthlyBudgets.find(b => b.category === addCategory);
    if (budgetItem && budgetItem.budgetAmount > 0) {
      const newTotal = budgetItem.actualAmount + Number(addAmount);
      if (newTotal > budgetItem.budgetAmount) {
        const exceededBy = newTotal - budgetItem.budgetAmount;
        setBudgetCheckMessage({
          budget: budgetItem.budgetAmount,
          actual: budgetItem.actualAmount,
          projected: newTotal,
          exceededBy,
          category: addCategory
        });
        return;
      }
    }
    setBudgetCheckMessage(null);
  }, [addAmount, addCategory, monthlyBudgets, isAddOpen]);

  // Compute live warning for Edit Modal
  useEffect(() => {
    if (!isEditOpen || !editAmount || !editCategory || monthlyBudgets.length === 0 || !selectedExpense) {
      setBudgetCheckMessage(null);
      return;
    }

    const budgetItem = monthlyBudgets.find(b => b.category === editCategory);
    if (budgetItem && budgetItem.budgetAmount > 0) {
      // Subtract the old amount of the edited expense first, since we are replacing it
      const oldAmount = selectedExpense.category === editCategory ? selectedExpense.amount : 0;
      const baseActual = Math.max(0, budgetItem.actualAmount - oldAmount);
      const newTotal = baseActual + Number(editAmount);

      if (newTotal > budgetItem.budgetAmount) {
        const exceededBy = newTotal - budgetItem.budgetAmount;
        setBudgetCheckMessage({
          budget: budgetItem.budgetAmount,
          actual: baseActual,
          projected: newTotal,
          exceededBy,
          category: editCategory
        });
        return;
      }
    }
    setBudgetCheckMessage(null);
  }, [editAmount, editCategory, monthlyBudgets, isEditOpen, selectedExpense]);

  const onAddExpense = async (data) => {
    try {
      await expenseAPI.create({
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: data.date
      });
      showAlert('success', 'Expense entry added successfully.');
      setIsAddOpen(false);
      resetAdd();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add expense.');
    }
  };

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setEditValue('amount', expense.amount);
    setEditValue('category', expense.category);
    setEditValue('description', expense.description || '');
    const formattedDate = new Date(expense.date).toISOString().split('T')[0];
    setEditValue('date', formattedDate);
    setIsEditOpen(true);
  };

  const onEditExpense = async (data) => {
    try {
      await expenseAPI.update(selectedExpense._id, {
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: data.date
      });
      showAlert('success', 'Expense entry updated successfully.');
      setIsEditOpen(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to update expense.');
    }
  };

  const onDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense entry?')) {
      try {
        await expenseAPI.delete(id);
        showAlert('success', 'Expense entry deleted successfully.');
        fetchExpenses();
      } catch (err) {
        console.error(err);
        showAlert('error', 'Failed to delete expense entry.');
      }
    }
  };

  return (
    <Layout title="Expense Management">
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

      {/* Filters & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by category or desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10 glass-input rounded-xl text-sm h-11"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select pl-4 glass-input rounded-xl text-sm h-11 text-slate-300 w-full sm:w-44"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="relative">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input pl-4 glass-input rounded-xl text-sm h-11 text-slate-300 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn bg-rose-500 hover:bg-rose-600 border-none text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-rose-500/10 flex items-center gap-1.5 w-full md:w-auto cursor-pointer transition-transform active:scale-95"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Expense List Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-rose-400"></span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg font-semibold">No expense entries found.</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting search/category filters or record a new expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="bg-transparent pl-4 py-3 text-left">Category</th>
                  <th className="bg-transparent py-3 text-left hidden sm:table-cell">Date</th>
                  <th className="bg-transparent py-3 text-left hidden md:table-cell">Description</th>
                  <th className="bg-transparent py-3 text-right">Amount</th>
                  <th className="bg-transparent pr-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="bg-transparent pl-4 py-4 align-middle">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
                        {exp.category}
                      </span>
                    </td>
                    <td className="bg-transparent py-4 text-sm text-slate-400 hidden sm:table-cell">
                      {new Date(exp.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="bg-transparent py-4 text-sm text-slate-500 max-w-[240px] truncate hidden md:table-cell">
                      {exp.description || '—'}
                    </td>
                    <td className="bg-transparent py-4 text-right font-bold text-rose-400 font-display text-sm">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="bg-transparent pr-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="btn btn-sm btn-ghost text-sky-400 hover:bg-sky-500/10 p-1.5 sm:p-2 rounded-lg cursor-pointer"
                          aria-label="Edit expense"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp._id)}
                          className="btn btn-sm btn-ghost text-rose-500 hover:bg-rose-500/10 p-1.5 sm:p-2 rounded-lg cursor-pointer"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-6">Add New Expense</h3>

            {/* LIVE BUDGET OVERRUN WARNING */}
            {budgetCheckMessage && (
              <div className="alert alert-warning bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-4 text-xs leading-relaxed animate-in fade-in duration-150">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-amber-300">⚠️ Monthly Budget Limit Alert!</p>
                  <p className="mt-1">
                    Your budget for <strong className="text-white">{budgetCheckMessage.category}</strong> is <strong className="text-white">${budgetCheckMessage.budget}</strong>. 
                    Adding this expense of <strong className="text-white">${addAmount}</strong> will make your total monthly spending <strong className="text-white">${budgetCheckMessage.projected.toFixed(2)}</strong>, exceeding the budget by <strong className="text-rose-400 font-bold">${budgetCheckMessage.exceededBy.toFixed(2)}</strong>!
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddSubmit(onAddExpense)} className="space-y-4">
              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Category</label>
                <select
                  className="select w-full glass-input rounded-xl text-sm"
                  {...registerAdd('category', { required: 'Category is required' })}
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
                  className={`input w-full glass-input rounded-xl text-sm ${addErrors.amount ? 'border-rose-500/50' : ''}`}
                  {...registerAdd('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than zero' }
                  })}
                />
                {addErrors.amount && <span className="text-rose-400 text-xs mt-1">{addErrors.amount.message}</span>}
              </div>

              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Date</label>
                <input
                  type="date"
                  className={`input w-full glass-input rounded-xl text-sm ${addErrors.date ? 'border-rose-500/50' : ''}`}
                  {...registerAdd('date', { required: 'Date is required' })}
                />
                {addErrors.date && <span className="text-rose-400 text-xs mt-1">{addErrors.date.message}</span>}
              </div>

              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Additional details..."
                  className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
                  {...registerAdd('description')}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-6">Edit Expense Entry</h3>

            {/* LIVE BUDGET OVERRUN WARNING */}
            {budgetCheckMessage && (
              <div className="alert alert-warning bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-3 mb-4 text-xs leading-relaxed animate-in fade-in duration-150">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-amber-300">⚠️ Monthly Budget Limit Alert!</p>
                  <p className="mt-1">
                    Your budget for <strong className="text-white">{budgetCheckMessage.category}</strong> is <strong className="text-white">${budgetCheckMessage.budget}</strong>. 
                    Updating this expense to <strong className="text-white">${editAmount}</strong> will make your total monthly spending <strong className="text-white">${budgetCheckMessage.projected.toFixed(2)}</strong>, exceeding the budget by <strong className="text-rose-400 font-bold">${budgetCheckMessage.exceededBy.toFixed(2)}</strong>!
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit(onEditExpense)} className="space-y-4">
              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Category</label>
                <select
                  className="select w-full glass-input rounded-xl text-sm"
                  {...registerEdit('category', { required: 'Category is required' })}
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
                  className={`input w-full glass-input rounded-xl text-sm ${editErrors.amount ? 'border-rose-500/50' : ''}`}
                  {...registerEdit('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than zero' }
                  })}
                />
                {editErrors.amount && <span className="text-rose-400 text-xs mt-1">{editErrors.amount.message}</span>}
              </div>

              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Date</label>
                <input
                  type="date"
                  className={`input w-full glass-input rounded-xl text-sm ${editErrors.date ? 'border-rose-500/50' : ''}`}
                  {...registerEdit('date', { required: 'Date is required' })}
                />
                {editErrors.date && <span className="text-rose-400 text-xs mt-1">{editErrors.date.message}</span>}
              </div>

              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Description (Optional)</label>
                <textarea
                  className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
                  {...registerEdit('description')}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn bg-slate-800 hover:bg-slate-700 border-none text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-rose-500 hover:bg-rose-600 border-none text-white font-bold rounded-xl px-6"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExpensePage;

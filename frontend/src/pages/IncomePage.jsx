import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import { incomeAPI, incomeSourceAPI } from '../services/api';
import { Plus, Search, Calendar, Edit2, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';

const IncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Income Sources State
  const [sources, setSources] = useState([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newEditSourceName, setNewEditSourceName] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isCustomAddVisible, setIsCustomAddVisible] = useState(false);
  const [isEditCustomAddVisible, setIsEditCustomAddVisible] = useState(false);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  // Forms
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, setValue: setAddValue, formState: { errors: addErrors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, setValue: setEditValue, formState: { errors: editErrors } } = useForm();

  // Toast helper
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchSources = async () => {
    try {
      const res = await incomeSourceAPI.getAll();
      setSources(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load income sources.');
    }
  };

  const handleAddCustomSource = async (mode) => {
    const name = mode === 'add' ? newSourceName : newEditSourceName;
    if (!name || !name.trim()) return;

    try {
      setIsAddingSource(true);
      const res = await incomeSourceAPI.create({ name: name.trim() });
      showAlert('success', 'Custom income source added!');
      await fetchSources();

      if (mode === 'add') {
        setAddValue('source', res.data.name);
        setNewSourceName('');
        setIsCustomAddVisible(false);
      } else {
        setEditValue('source', res.data.name);
        setNewEditSourceName('');
        setIsEditCustomAddVisible(false);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add custom source.');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleDeleteCustomSource = async (id, name, mode) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await incomeSourceAPI.delete(id);
        showAlert('success', `Deleted source "${name}"`);
        await fetchSources();
        if (mode === 'add') {
          setAddValue('source', '');
        } else {
          setEditValue('source', '');
        }
      } catch (err) {
        console.error(err);
        showAlert('error', 'Failed to delete custom source.');
      }
    }
  };

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await incomeAPI.getAll(search, monthFilter);
      setIncomes(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load income entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    // Debounce search slightly
    const delayDebounce = setTimeout(() => {
      fetchIncomes();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, monthFilter]);

  const onAddIncome = async (data) => {
    try {
      await incomeAPI.create({
        amount: Number(data.amount),
        source: data.source,
        note: data.note,
        date: data.date
      });
      showAlert('success', 'Income entry added successfully.');
      setIsAddOpen(false);
      resetAdd();
      setIsCustomAddVisible(false);
      setNewSourceName('');
      fetchIncomes();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add income.');
    }
  };

  const openEditModal = (income) => {
    setSelectedIncome(income);
    setEditValue('amount', income.amount);
    setEditValue('source', income.source);
    setEditValue('note', income.note || '');
    // Format date to YYYY-MM-DD for date input
    const formattedDate = new Date(income.date).toISOString().split('T')[0];
    setEditValue('date', formattedDate);
    setIsEditOpen(true);
  };

  const onEditIncome = async (data) => {
    try {
      await incomeAPI.update(selectedIncome._id, {
        amount: Number(data.amount),
        source: data.source,
        note: data.note,
        date: data.date
      });
      showAlert('success', 'Income entry updated successfully.');
      setIsEditOpen(false);
      fetchIncomes();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to update income.');
    }
  };

  const onDeleteIncome = async (id) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await incomeAPI.delete(id);
        showAlert('success', 'Income entry deleted successfully.');
        fetchIncomes();
      } catch (err) {
        console.error(err);
        showAlert('error', 'Failed to delete income entry.');
      }
    }
  };

  return (
    <Layout title="Income Management">
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

      {/* Action Filters Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by source or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10 glass-input rounded-xl text-sm h-11"
            />
          </div>

          {/* Month Selector */}
          <div className="relative">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input pl-4 glass-input rounded-xl text-sm h-11 text-slate-300 w-full sm:w-48"
            />
          </div>
        </div>

        {/* Add Income Button */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl h-11 px-5 shadow-lg shadow-sky-500/10 flex items-center gap-1.5 w-full md:w-auto cursor-pointer transition-transform active:scale-95"
        >
          <Plus size={18} />
          Add Income
        </button>
      </div>

      {/* Income List Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-sky-400"></span>
          </div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg font-semibold">No income entries found.</p>
            <p className="text-slate-600 text-sm mt-1">Try resetting search query / date filters or insert a new income.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="bg-transparent pl-4 py-3 text-left">Source</th>
                  <th className="bg-transparent py-3 text-left hidden sm:table-cell">Date</th>
                  <th className="bg-transparent py-3 text-left hidden md:table-cell">Note</th>
                  <th className="bg-transparent py-3 text-right">Amount</th>
                  <th className="bg-transparent pr-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {incomes.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="bg-transparent pl-4 py-4 font-semibold text-slate-200 text-sm">
                      {inc.source}
                    </td>
                    <td className="bg-transparent py-4 text-sm text-slate-400 hidden sm:table-cell">
                      {new Date(inc.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="bg-transparent py-4 text-sm text-slate-500 max-w-[200px] truncate hidden md:table-cell">
                      {inc.note || '—'}
                    </td>
                    <td className="bg-transparent py-4 text-right font-bold text-emerald-400 font-display text-sm">
                      ${Number(inc.amount).toFixed(2)}
                    </td>
                    <td className="bg-transparent pr-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => openEditModal(inc)}
                          className="btn btn-sm btn-ghost text-sky-400 hover:bg-sky-500/10 p-1.5 sm:p-2 rounded-lg cursor-pointer"
                          aria-label="Edit income"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteIncome(inc._id)}
                          className="btn btn-sm btn-ghost text-rose-500 hover:bg-rose-500/10 p-1.5 sm:p-2 rounded-lg cursor-pointer"
                          aria-label="Delete income"
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

            <h3 className="text-xl font-bold text-slate-100 mb-6">Add New Income</h3>
            <form onSubmit={handleAddSubmit(onAddIncome)} className="space-y-4">
              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Source</label>
                <select
                  className={`select w-full glass-input rounded-xl text-sm h-11 min-h-[44px] ${addErrors.source ? 'border-rose-500/50' : ''}`}
                  {...registerAdd('source', { required: 'Source is required' })}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCustomAddVisible(true);
                    } else {
                      setIsCustomAddVisible(false);
                    }
                  }}
                >
                  <option value="">Select a source...</option>
                  {sources.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                  <option value="__NEW__">+ Add Custom Source...</option>
                </select>
                {addErrors.source && <span className="text-rose-400 text-xs mt-1">{addErrors.source.message}</span>}

                {isCustomAddVisible && (
                  <div className="form-control bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl mt-2 space-y-3">
                    <div>
                      <label className="label text-slate-400 text-xs font-semibold mb-1">Add Custom Source</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. YouTube, Dividends"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          className="input flex-1 glass-input rounded-xl text-sm h-10"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSource('add')}
                          disabled={isAddingSource}
                          className="btn btn-sm bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl px-4 h-10 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {sources.filter(s => !s.isDefault).length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">Your Custom Sources</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {sources.filter(s => !s.isDefault).map(s => (
                            <div key={s._id} className="flex items-center justify-between bg-slate-900/30 px-2.5 py-1.5 rounded-lg border border-slate-800/40 text-xs">
                              <span className="text-slate-300 font-medium">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomSource(s._id, s.name, 'add')}
                                className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                <label className="label text-slate-400 text-xs font-semibold mb-1">Note (Optional)</label>
                <textarea
                  placeholder="Additional details..."
                  className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
                  {...registerAdd('note')}
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
                  className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl px-6"
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

            <h3 className="text-xl font-bold text-slate-100 mb-6">Edit Income Entry</h3>
            <form onSubmit={handleEditSubmit(onEditIncome)} className="space-y-4">
              <div className="form-control">
                <label className="label text-slate-400 text-xs font-semibold mb-1">Source</label>
                <select
                  className={`select w-full glass-input rounded-xl text-sm h-11 min-h-[44px] ${editErrors.source ? 'border-rose-500/50' : ''}`}
                  {...registerEdit('source', { required: 'Source is required' })}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsEditCustomAddVisible(true);
                    } else {
                      setIsEditCustomAddVisible(false);
                    }
                  }}
                >
                  <option value="">Select a source...</option>
                  {sources.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                  <option value="__NEW__">+ Add Custom Source...</option>
                </select>
                {editErrors.source && <span className="text-rose-400 text-xs mt-1">{editErrors.source.message}</span>}

                {isEditCustomAddVisible && (
                  <div className="form-control bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl mt-2 space-y-3">
                    <div>
                      <label className="label text-slate-400 text-xs font-semibold mb-1">Add Custom Source</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. YouTube, Dividends"
                          value={newEditSourceName}
                          onChange={(e) => setNewEditSourceName(e.target.value)}
                          className="input flex-1 glass-input rounded-xl text-sm h-10"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSource('edit')}
                          disabled={isAddingSource}
                          className="btn btn-sm bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl px-4 h-10 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {sources.filter(s => !s.isDefault).length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">Your Custom Sources</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {sources.filter(s => !s.isDefault).map(s => (
                            <div key={s._id} className="flex items-center justify-between bg-slate-900/30 px-2.5 py-1.5 rounded-lg border border-slate-800/40 text-xs">
                              <span className="text-slate-300 font-medium">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomSource(s._id, s.name, 'edit')}
                                className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition hover:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                <label className="label text-slate-400 text-xs font-semibold mb-1">Note (Optional)</label>
                <textarea
                  className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
                  {...registerEdit('note')}
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
                  className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl px-6"
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

export default IncomePage;

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';
import { incomeAPI, incomeSourceAPI } from '../services/api';

const AddIncomeModal = ({ isOpen, onClose, onSuccess, showAlert }) => {
  const [sources, setSources] = useState([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isCustomAddVisible, setIsCustomAddVisible] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      source: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    }
  });

  const fetchSources = async () => {
    try {
      const res = await incomeSourceAPI.getAll();
      setSources(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load income sources.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  const handleAddCustomSource = async () => {
    if (!newSourceName || !newSourceName.trim()) return;

    try {
      setIsAddingSource(true);
      const res = await incomeSourceAPI.create({ name: newSourceName.trim() });
      showAlert('success', 'Custom income source added!');
      await fetchSources();
      setValue('source', res.data.name);
      setNewSourceName('');
      setIsCustomAddVisible(false);
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add custom source.');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleDeleteCustomSource = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await incomeSourceAPI.delete(id);
        showAlert('success', `Deleted source "${name}"`);
        await fetchSources();
        setValue('source', '');
      } catch (err) {
        console.error(err);
        showAlert('error', 'Failed to delete custom source.');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      await incomeAPI.create({
        amount: Number(data.amount),
        source: data.source,
        note: data.note,
        date: data.date
      });
      showAlert('success', 'Income entry added successfully.');
      reset();
      setIsCustomAddVisible(false);
      setNewSourceName('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Failed to add income.');
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

        <h3 className="text-xl font-bold text-slate-100 mb-6">Add New Income</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label text-slate-400 text-xs font-semibold mb-1">Source</label>
            <select
              className={`select w-full glass-input rounded-xl text-sm h-11 min-h-[44px] ${errors.source ? 'border-rose-500/50' : ''}`}
              {...register('source', { required: 'Source is required' })}
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
            {errors.source && <span className="text-rose-400 text-xs mt-1">{errors.source.message}</span>}

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
                      onClick={handleAddCustomSource}
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
                            onClick={() => handleDeleteCustomSource(s._id, s.name)}
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
            <label className="label text-slate-400 text-xs font-semibold mb-1">Note (Optional)</label>
            <textarea
              placeholder="Additional details..."
              className="textarea w-full glass-input rounded-xl text-sm h-20 py-2.5"
              {...register('note')}
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
              className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl px-6"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeModal;

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import RecentTransactions from '../components/RecentTransactions';
import ExpenseCategoryChart from '../components/Charts/ExpenseCategoryChart';
import IncomeExpenseChart from '../components/Charts/IncomeExpenseChart';
import SavingsTrendChart from '../components/Charts/SavingsTrendChart';
import AddExpenseModal from '../components/AddExpenseModal';
import AddIncomeModal from '../components/AddIncomeModal';
import { reportAPI } from '../services/api';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, RefreshCw, AlertTriangle, Plus, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    balance: 0
  });
  const [chartData, setChartData] = useState({
    expenseByCategory: [],
    monthlyFlow: []
  });

  // Modal and Refresh states
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewRes, chartRes] = await Promise.all([
        reportAPI.getOverview(),
        reportAPI.getChartData()
      ]);

      setStats(overviewRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <Layout title="Dashboard Overview">
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

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold">Connection Error</h3>
            <p className="text-xs text-rose-400/80 mt-1">{error}</p>
            <button 
              onClick={fetchDashboardData} 
              className="btn btn-xs bg-rose-500 hover:bg-rose-600 border-none text-white font-semibold rounded-lg mt-3 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl text-center sm:text-left w-full">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Quick Actions</h3>
          <p className="text-xs text-slate-500 mt-0.5">Quickly log financial activities directly</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="btn bg-rose-500 hover:bg-rose-600 border-none text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-rose-500/10 flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer transition-transform active:scale-95 text-sm"
          >
            <Plus size={18} />
            Add Expense
          </button>
          <button
            onClick={() => setIsIncomeOpen(true)}
            className="btn bg-sky-500 hover:bg-sky-600 border-none text-slate-950 font-bold rounded-xl h-11 px-5 shadow-lg shadow-sky-500/10 flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer transition-transform active:scale-95 text-sm"
          >
            <Plus size={18} />
            Add Income
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SummaryCard
          title="Total Income"
          value={stats.totalIncome}
          icon={<TrendingUp size={22} />}
          color="emerald"
        />
        <SummaryCard
          title="Total Expenses"
          value={stats.totalExpense}
          icon={<TrendingDown size={22} />}
          color="rose"
        />
        <SummaryCard
          title="Total Savings"
          value={stats.savings}
          icon={<PiggyBank size={22} />}
          color="indigo"
        />
        <SummaryCard
          title="Current Balance"
          value={stats.balance}
          icon={<Wallet size={22} />}
          color="sky"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={chartData.monthlyFlow} loading={loading} />
        </div>
        <div>
          <ExpenseCategoryChart data={chartData.expenseByCategory} loading={loading} />
        </div>
      </div>

      {/* Bottom Row - Recent Activity & Savings Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions refreshTrigger={refreshTrigger} />
        </div>
        <div>
          <SavingsTrendChart data={chartData.monthlyFlow} loading={loading} />
        </div>
      </div>

      {/* Transaction Modals */}
      <AddExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={handleTransactionSuccess}
        showAlert={showAlert}
      />
      <AddIncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        onSuccess={handleTransactionSuccess}
        showAlert={showAlert}
      />
    </Layout>
  );
};

export default Dashboard;

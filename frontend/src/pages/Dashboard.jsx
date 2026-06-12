import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import RecentTransactions from '../components/RecentTransactions';
import ExpenseCategoryChart from '../components/Charts/ExpenseCategoryChart';
import IncomeExpenseChart from '../components/Charts/IncomeExpenseChart';
import SavingsTrendChart from '../components/Charts/SavingsTrendChart';
import { reportAPI } from '../services/api';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, RefreshCw, AlertTriangle } from 'lucide-react';

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

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <RecentTransactions />
        </div>
        <div>
          <SavingsTrendChart data={chartData.monthlyFlow} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

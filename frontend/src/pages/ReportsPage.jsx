import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ExpenseCategoryChart from '../components/Charts/ExpenseCategoryChart';
import IncomeExpenseChart from '../components/Charts/IncomeExpenseChart';
import SavingsTrendChart from '../components/Charts/SavingsTrendChart';
import { reportAPI } from '../services/api';
import { FileText, Printer, Calendar, Download, TrendingUp, TrendingDown, PiggyBank, Receipt, Award, AlertTriangle } from 'lucide-react';

const ReportsPage = () => {
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [chartData, setChartData] = useState({
    expenseByCategory: [],
    monthlyFlow: []
  });

  // Monthly Report States
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [reportError, setReportError] = useState(null);

  const fetchChartData = async () => {
    try {
      setLoadingCharts(true);
      const res = await reportAPI.getChartData();
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchMonthlyReport = async () => {
    if (!selectedMonth) return;
    try {
      setLoadingReport(true);
      setReportError(null);
      const res = await reportAPI.getMonthlyDetails(selectedMonth);
      setMonthlyReport(res.data);
    } catch (err) {
      console.error(err);
      setReportError("Failed to generate report for selected month.");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  // Convert "2026-06" to "June 2026"
  const formatMonthTitle = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <Layout title="Reports & Analytics">
      {/* Printable Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Summary Form & Display */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 lg:col-span-1 flex flex-col h-full justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText size={20} className="text-sky-400" />
                Monthly Statements
              </h3>
              <p className="text-xs text-slate-500 mt-1">Compile comprehensive statement for a selected month</p>
            </div>

            <div className="form-control">
              <label className="label text-slate-400 text-xs font-semibold mb-1">Select Month</label>
              <div className="relative">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input w-full pl-4 glass-input rounded-xl text-sm h-11 text-slate-300"
                />
              </div>
            </div>

            {loadingReport ? (
              <div className="flex items-center justify-center py-10">
                <span className="loading loading-spinner loading-md text-sky-400"></span>
              </div>
            ) : reportError ? (
              <div className="alert alert-error bg-rose-500/10 border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertTriangle size={16} />
                <span>{reportError}</span>
              </div>
            ) : monthlyReport ? (
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-5 space-y-4 shadow-inner">
                <div className="text-center pb-3 border-b border-slate-800/80">
                  <h4 className="font-bold text-slate-200 text-sm">MasikHisab Statement</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{formatMonthTitle(selectedMonth)}</p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><TrendingUp size={13} className="text-emerald-400" /> Total Income</span>
                    <strong className="text-slate-200">${monthlyReport.totalIncome.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><TrendingDown size={13} className="text-rose-400" /> Total Expense</span>
                    <strong className="text-slate-200">${monthlyReport.totalExpense.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><PiggyBank size={13} className="text-indigo-400" /> Total Savings</span>
                    <strong className={`font-bold ${monthlyReport.totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${monthlyReport.totalSavings.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Award size={13} className="text-sky-400" /> Highest Expense</span>
                    <strong className="text-slate-200 truncate max-w-[120px]" title={monthlyReport.highestExpenseCategory}>
                      {monthlyReport.highestExpenseCategory.split(' ')[0]}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Receipt size={13} className="text-purple-400" /> Transactions Count</span>
                    <strong className="text-slate-200">{monthlyReport.totalTransactions}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {monthlyReport && (
            <button
              onClick={handlePrint}
              className="btn w-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 font-semibold rounded-xl h-11 flex items-center justify-center gap-1.5 mt-6 cursor-pointer"
            >
              <Printer size={16} />
              Print Statement
            </button>
          )}
        </div>

        {/* Category Breakdown (Pie Chart) - Full Size */}
        <div className="lg:col-span-2">
          <ExpenseCategoryChart data={chartData.expenseByCategory} loading={loadingCharts} />
        </div>
      </div>

      {/* Analytics Charts - Income vs Expense comparison (Bar) & Savings Trends (Line) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <IncomeExpenseChart data={chartData.monthlyFlow} loading={loadingCharts} />
        </div>
        <div>
          <SavingsTrendChart data={chartData.monthlyFlow} loading={loadingCharts} />
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;

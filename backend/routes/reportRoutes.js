const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const Expense = require('../models/Expense');

// Helper function to format month label (e.g., "2026-06" -> "Jun 2026")
const getMonthLabel = (year, monthNum) => {
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

// Helper: Month array mapping
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// @route   GET /api/reports/overview
// @desc    Get total summary stats
router.get('/overview', async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.auth.userId });
    const expenses = await Expense.find({ userId: req.auth.userId });

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const savings = totalIncome - totalExpense;
    const balance = totalIncome - totalExpense; // Balance = Savings in this context

    res.json({
      totalIncome,
      totalExpense,
      savings,
      balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/recent-transactions
// @desc    Get latest 10 transactions (mixed incomes and expenses)
router.get('/recent-transactions', async (req, res) => {
  try {
    // Get latest 10 incomes
    const incomes = await Income.find({ userId: req.auth.userId }).sort({ date: -1, createdAt: -1 }).limit(10);
    // Get latest 10 expenses
    const expenses = await Expense.find({ userId: req.auth.userId }).sort({ date: -1, createdAt: -1 }).limit(10);

    // Format incomes
    const formattedIncomes = incomes.map(inc => ({
      _id: inc._id,
      type: 'Income',
      amount: inc.amount,
      categoryOrSource: inc.source,
      noteOrDesc: inc.note,
      date: inc.date,
      createdAt: inc.createdAt
    }));

    // Format expenses
    const formattedExpenses = expenses.map(exp => ({
      _id: exp._id,
      type: 'Expense',
      amount: exp.amount,
      categoryOrSource: exp.category,
      noteOrDesc: exp.description,
      date: exp.date,
      createdAt: exp.createdAt
    }));

    // Combine, sort by date descending, and limit to 10
    const recent = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/chart-data
// @desc    Get aggregated data for Recharts (Pie, Bar, Line)
router.get('/chart-data', async (req, res) => {
  try {
    // Fetch user data
    const allIncomes = await Income.find({ userId: req.auth.userId });
    const allExpenses = await Expense.find({ userId: req.auth.userId });

    // 1. Expense by Category (Pie Chart)
    const categoryTotals = {};
    allExpenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const expenseByCategory = Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    }));

    // 2. Income vs Expense (Bar Chart) & Savings Trend (Line Chart) over last 12 months
    const monthlyData = {};

    allIncomes.forEach(inc => {
      const d = new Date(inc.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { monthKey: key, income: 0, expense: 0 };
      }
      monthlyData[key].income += inc.amount;
    });

    allExpenses.forEach(exp => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { monthKey: key, income: 0, expense: 0 };
      }
      monthlyData[key].expense += exp.amount;
    });

    // Sort months chronologically
    const sortedMonthKeys = Object.keys(monthlyData).sort();
    
    // If no data, return a mock default array to make chart loading clean
    let charts = sortedMonthKeys.map(key => {
      const [year, month] = key.split('-').map(Number);
      const label = getMonthLabel(year, month);
      const income = monthlyData[key].income;
      const expense = monthlyData[key].expense;
      const savings = income - expense;
      return {
        monthKey: key,
        name: label,
        income,
        expense,
        savings
      };
    });

    // Return current and previous data
    res.json({
      expenseByCategory: expenseByCategory.length > 0 ? expenseByCategory : [],
      monthlyFlow: charts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/monthly
// @desc    Get detailed stats for a specific month (Format: YYYY-MM)
router.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Month parameter (YYYY-MM) is required.' });
    }

    const [year, m] = month.split('-').map(Number);
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 1);

    // Fetch transactions in that range
    const incomes = await Income.find({ userId: req.auth.userId, date: { $gte: startDate, $lt: endDate } });
    const expenses = await Expense.find({ userId: req.auth.userId, date: { $gte: startDate, $lt: endDate } });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSavings = totalIncome - totalExpense;
    const totalTransactions = incomes.length + expenses.length;

    // Aggregate category expenses to find the highest category
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    let highestExpenseCategory = 'None';
    let maxExpense = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > maxExpense) {
        maxExpense = categoryTotals[cat];
        highestExpenseCategory = cat;
      }
    });

    if (highestExpenseCategory !== 'None') {
      highestExpenseCategory = `${highestExpenseCategory} ($${maxExpense})`;
    }

    res.json({
      totalIncome,
      totalExpense,
      totalSavings,
      highestExpenseCategory,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/transactions
// @desc    Get all transactions matching filters (search, month, category, type)
router.get('/transactions', async (req, res) => {
  try {
    const { search, month, category, type } = req.query;
    
    let incomeQuery = { userId: req.auth.userId };
    let expenseQuery = { userId: req.auth.userId };

    // 1. Month Filter (Format: YYYY-MM)
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 1);
      incomeQuery.date = { $gte: startDate, $lt: endDate };
      expenseQuery.date = { $gte: startDate, $lt: endDate };
    }

    // 2. Category Filter (exact)
    let fetchIncomes = true;
    if (category) {
      expenseQuery.category = category;
      fetchIncomes = false; // Category filter only applies to expenses
    }

    // 3. Search Filter (matches source/note for income, category/description for expense)
    if (search) {
      incomeQuery.$or = [
        { source: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
      expenseQuery.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 4. Type Filter
    let incomes = [];
    let expenses = [];

    if (type !== 'Expense' && fetchIncomes) {
      incomes = await Income.find(incomeQuery);
    }
    if (type !== 'Income') {
      expenses = await Expense.find(expenseQuery);
    }

    // Format incomes
    const formattedIncomes = incomes.map(inc => ({
      _id: inc._id,
      type: 'Income',
      amount: inc.amount,
      categoryOrSource: inc.source,
      noteOrDesc: inc.note,
      date: inc.date,
      createdAt: inc.createdAt
    }));

    // Format expenses
    const formattedExpenses = expenses.map(exp => ({
      _id: exp._id,
      type: 'Expense',
      amount: exp.amount,
      categoryOrSource: exp.category,
      noteOrDesc: exp.description,
      date: exp.date,
      createdAt: exp.createdAt
    }));

    // Merge and sort
    const allTransactions = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

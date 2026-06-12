const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @route   GET /api/budgets
// @desc    Get all budgets (with optional month & year filter)
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.auth.userId };
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const budgets = await Budget.find(query);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/budgets
// @desc    Create or update a budget for a category, month, and year
router.post('/', async (req, res) => {
  try {
    const { category, budgetAmount, month, year } = req.body;

    if (!category || budgetAmount === undefined || !month || !year) {
      return res.status(400).json({ message: 'Category, budget amount, month, and year are required.' });
    }

    // Upsert budget: find matching category + month + year and update, or create if not exists
    const budget = await Budget.findOneAndUpdate(
      { userId: req.auth.userId, category, month: Number(month), year: Number(year) },
      { budgetAmount: Number(budgetAmount) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/budgets/monthly-status
// @desc    Get budget vs actual expenses for all categories in a month/year
router.get('/monthly-status', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and Year parameters are required.' });
    }

    const m = Number(month);
    const y = Number(year);

    // Fetch all budgets for this month/year
    const budgets = await Budget.find({ userId: req.auth.userId, month: m, year: y });
    
    // Fetch all expenses for this month/year
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);
    
    const expenses = await Expense.find({
      userId: req.auth.userId,
      date: { $gte: startDate, $lt: endDate }
    });

    // Aggregate expenses by category
    const actuals = {};
    expenses.forEach(exp => {
      actuals[exp.category] = (actuals[exp.category] || 0) + exp.amount;
    });

    // Compile response
    // Include all budgets and categories that have expenses
    const categories = [
      'Food', 'Rent', 'Transport', 'Internet', 'Mobile Recharge', 
      'Shopping', 'Entertainment', 'Medical', 'Family', 'Others'
    ];

    const report = categories.map(cat => {
      const budgetObj = budgets.find(b => b.category === cat);
      const budgetAmount = budgetObj ? budgetObj.budgetAmount : 0;
      const actualAmount = actuals[cat] || 0;
      return {
        category: cat,
        budgetAmount,
        actualAmount,
        exceeded: budgetAmount > 0 && actualAmount > budgetAmount,
        difference: budgetAmount - actualAmount
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

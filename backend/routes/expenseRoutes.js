const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// @route   GET /api/expenses
// @desc    Get all expenses (with optional search, category, and month filtering)
router.get('/', async (req, res) => {
  try {
    const { search, category, month } = req.query;
    let query = { userId: req.auth.userId };

    // 1. Search filter (description or category)
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Category filter (exact match)
    if (category) {
      query.category = category;
    }

    // 3. Month filter (Format: YYYY-MM)
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Sort by date descending, then createdAt descending
    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/expenses
// @desc    Add new expense
router.post('/', async (req, res) => {
  try {
    console.log('req.auth:', req.auth);
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ message: 'Amount, Category, and Date are required.' });
    }

    const newExpense = new Expense({
      userId: req.auth.userId,
      amount: Number(amount),
      category,
      description,
      date: new Date(date)
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
router.put('/:id', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    let expense = await Expense.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense entry not found.' });
    }

    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = new Date(date);

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense entry not found.' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense entry removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

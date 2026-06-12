const express = require('express');
const router = express.Router();
const Income = require('../models/Income');

// @route   GET /api/incomes
// @desc    Get all incomes (with optional search and month filtering)
router.get('/', async (req, res) => {
  try {
    const { search, month } = req.query;
    let query = { userId: req.auth.userId };

    // 1. Search filter (source or note)
    if (search) {
      query.$or = [
        { source: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Month filter (Format: YYYY-MM)
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      // Start of month (local time mapping or UTC)
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 1); // 1st of next month (exclusive)
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Sort by date descending, then createdAt descending
    const incomes = await Income.find(query).sort({ date: -1, createdAt: -1 });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/incomes
// @desc    Add new income
router.post('/', async (req, res) => {
  try {
    const { amount, source, note, date } = req.body;
    
    if (!amount || !source || !date) {
      return res.status(400).json({ message: 'Amount, Source, and Date are required.' });
    }

    const newIncome = new Income({
      userId: req.auth.userId,
      amount: Number(amount),
      source,
      note,
      date: new Date(date)
    });

    const savedIncome = await newIncome.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/incomes/:id
// @desc    Update an income
router.put('/:id', async (req, res) => {
  try {
    const { amount, source, note, date } = req.body;
    
    let income = await Income.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!income) {
      return res.status(404).json({ message: 'Income entry not found.' });
    }

    if (amount !== undefined) income.amount = Number(amount);
    if (source !== undefined) income.source = source;
    if (note !== undefined) income.note = note;
    if (date !== undefined) income.date = new Date(date);

    const updatedIncome = await income.save();
    res.json(updatedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/incomes/:id
// @desc    Delete an income
router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!income) {
      return res.status(404).json({ message: 'Income entry not found.' });
    }

    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: 'Income entry removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

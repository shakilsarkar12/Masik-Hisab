const express = require('express');
const router = express.Router();
const IncomeSource = require('../models/IncomeSource');

const defaultSources = [
  { name: 'Salary', isDefault: true },
  { name: 'Freelance', isDefault: true },
  { name: 'Investments', isDefault: true },
  { name: 'Business', isDefault: true },
  { name: 'Gifts', isDefault: true },
  { name: 'Others', isDefault: true }
];

// @route   GET /api/income-sources
// @desc    Get all default and custom income sources for the user
router.get('/', async (req, res) => {
  try {
    const customSources = await IncomeSource.find({ userId: req.auth.userId });
    const formattedCustom = customSources.map(source => ({
      _id: source._id,
      name: source.name,
      isDefault: false
    }));

    res.json([...defaultSources, ...formattedCustom]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/income-sources
// @desc    Add a new custom income source
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Income source name is required.' });
    }

    const trimmedName = name.trim();

    // Prevent matching default sources (case-insensitive)
    const isDefault = defaultSources.some(
      s => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDefault) {
      return res.status(400).json({ message: 'This is a default income source and is already available.' });
    }

    // Prevent duplicates for the same user (case-insensitive)
    const exists = await IncomeSource.findOne({
      userId: req.auth.userId,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (exists) {
      return res.status(400).json({ message: 'Income source already exists.' });
    }

    const newSource = new IncomeSource({
      userId: req.auth.userId,
      name: trimmedName
    });

    const savedSource = await newSource.save();
    res.status(201).json({
      _id: savedSource._id,
      name: savedSource.name,
      isDefault: false
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/income-sources/:id
// @desc    Delete a custom income source
router.delete('/:id', async (req, res) => {
  try {
    const source = await IncomeSource.findOneAndDelete({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!source) {
      return res.status(404).json({ message: 'Income source not found or unauthorized.' });
    }

    res.json({ message: 'Income source removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

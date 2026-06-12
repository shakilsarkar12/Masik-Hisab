const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food',
      'Rent',
      'Transport',
      'Internet',
      'Mobile Recharge',
      'Shopping',
      'Entertainment',
      'Medical',
      'Family',
      'Others'
    ]
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);

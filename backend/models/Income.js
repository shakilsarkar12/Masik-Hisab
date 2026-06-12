const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true
  },
  note: {
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

module.exports = mongoose.model('Income', IncomeSchema);

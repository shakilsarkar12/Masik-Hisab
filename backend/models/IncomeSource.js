const mongoose = require('mongoose');

const IncomeSourceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Income source name is required'],
    trim: true
  }
});

// Enforce unique source names per user
IncomeSourceSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('IncomeSource', IncomeSourceSchema);

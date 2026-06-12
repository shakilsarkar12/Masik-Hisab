const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
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
  budgetAmount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount must be positive']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2000, 'Year must be valid']
  }
});

// Category, month, year, and userId should be unique together to prevent duplicates for the same user
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', BudgetSchema);

// Programmatically drop the old unique index (which lacked userId) to avoid index conflicts
if (mongoose.connection) {
  mongoose.connection.once('open', async () => {
    try {
      await Budget.collection.dropIndex('category_1_month_1_year_1');
      console.log('Successfully dropped old Budget index: category_1_month_1_year_1');
    } catch (err) {
      // Index might not exist or already be dropped, which is fine
    }
  });
}

module.exports = Budget;

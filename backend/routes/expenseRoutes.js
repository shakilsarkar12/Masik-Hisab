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
    
    // Non-blocking background check for budget limits
    checkBudgetLimit(req.auth.userId, savedExpense.category, savedExpense.date);

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
    
    // Non-blocking background check for budget limits
    checkBudgetLimit(req.auth.userId, updatedExpense.category, updatedExpense.date);

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

// Helper function to check category budget limits, write notification & send email
const checkBudgetLimit = async (userId, category, date) => {
  try {
    const Budget = require('../models/Budget');
    const Notification = require('../models/Notification');
    const NotificationSettings = require('../models/NotificationSettings');
    const { sendEmail } = require('../config/cronScheduler');
    const { clerkClient } = require('@clerk/express');

    const expenseDate = new Date(date);
    const m = expenseDate.getMonth() + 1;
    const y = expenseDate.getFullYear();

    // Find if a budget exists for this category, month, and year
    const budgetObj = await Budget.findOne({ userId, category, month: m, year: y });
    if (!budgetObj || budgetObj.budgetAmount <= 0) {
      return; // No budget limit configured
    }

    // Sum all expenses for this month in this category
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);
    const expensesInMonth = await Expense.find({
      userId,
      category,
      date: { $gte: startDate, $lt: endDate }
    });

    const actualAmount = expensesInMonth.reduce((sum, item) => sum + item.amount, 0);

    if (actualAmount > budgetObj.budgetAmount) {
      const exceededAmount = actualAmount - budgetObj.budgetAmount;
      const title = 'Budget Overrun Alert! ⚠️';
      const message = `Your total spending on "${category}" for this month has reached $${actualAmount.toFixed(2)}, exceeding your budget of $${budgetObj.budgetAmount.toFixed(2)} by $${exceededAmount.toFixed(2)}!`;

      // Check if a similar notification was created in the last 2 minutes to avoid duplication
      const recentNotif = await Notification.findOne({
        userId,
        type: 'danger',
        message: { $regex: category },
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
      });

      if (!recentNotif) {
        // Create in-app notification
        const newNotification = new Notification({
          userId,
          title,
          message,
          type: 'danger'
        });
        await newNotification.save();

        // Check if email alerts are active
        const settings = await NotificationSettings.findOne({ userId });
        if (!settings || (settings.emailNotificationsEnabled && settings.budgetAlertsEnabled)) {
          // Fetch user email from Clerk
          const user = await clerkClient.users.getUser(userId);
          const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;

          if (email) {
            const htmlContent = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
                <div style="text-align: center; border-bottom: 1px solid #f43f5e; padding-bottom: 20px; margin-bottom: 20px;">
                  <h1 style="color: #f43f5e; margin: 0; font-size: 24px;">Budget Limit Exceeded! ⚠️</h1>
                  <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">MasikHisab Alert System</p>
                </div>
                <div style="line-height: 1.6; font-size: 16px;">
                  <p>Hello ${user.firstName || 'there'},</p>
                  <p>You have exceeded your monthly budget allocation for the <strong style="color: #f43f5e;">${category}</strong> category.</p>
                  
                  <div style="background-color: #1e293b; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Budget Limit:</td>
                        <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #cbd5e1;">$${budgetObj.budgetAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 8px;">Current Spending:</td>
                        <td style="font-weight: bold; text-align: right; color: #f43f5e; padding-bottom: 8px;">$${actualAmount.toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 1px solid #334155;">
                        <td style="color: #f8fafc; font-weight: bold; padding-top: 8px;">Over Budget By:</td>
                        <td style="font-weight: bold; text-align: right; color: #f43f5e; padding-top: 8px;">$${exceededAmount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>

                  <p>Please review your upcoming expenses or update your budget limit if needed.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://masikhisab.vercel.app'}" style="background-color: #f43f5e; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">View Budget Planner</a>
                  </div>
                </div>
                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #64748b;">
                  &copy; 2026 MasikHisab. All rights reserved.
                </div>
              </div>
            `;

            await sendEmail(
              email,
              `MasikHisab Alert: ${category} budget exceeded! ⚠️`,
              `Hello, your monthly budget for ${category} has been exceeded. Limit: $${budgetObj.budgetAmount.toFixed(2)}, Current: $${actualAmount.toFixed(2)}.`,
              htmlContent
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('[BudgetChecker] Error during budget limit validation:', error);
  }
};

module.exports = router;

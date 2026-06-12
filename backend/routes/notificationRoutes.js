const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');

// @route   GET /api/notifications
// @desc    Get user's recent notifications (limit to 50)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications of user as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.auth.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.auth.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    notification.read = true;
    const updated = await notification.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/notifications/settings
// @desc    Get user notification settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.auth.userId });
    
    // If settings don't exist yet, create a default configuration
    if (!settings) {
      settings = new NotificationSettings({
        userId: req.auth.userId
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notifications/settings
// @desc    Update user notification settings
router.put('/settings', async (req, res) => {
  try {
    const { 
      emailNotificationsEnabled, 
      dailyReminderEnabled, 
      dailyReminderTime, 
      budgetAlertsEnabled 
    } = req.body;

    let settings = await NotificationSettings.findOne({ userId: req.auth.userId });
    
    if (!settings) {
      settings = new NotificationSettings({ userId: req.auth.userId });
    }

    if (emailNotificationsEnabled !== undefined) {
      settings.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (dailyReminderEnabled !== undefined) {
      settings.dailyReminderEnabled = dailyReminderEnabled;
    }
    if (dailyReminderTime !== undefined) {
      // Basic validation for format HH:MM
      if (/^\d{2}:\d{2}$/.test(dailyReminderTime)) {
        settings.dailyReminderTime = dailyReminderTime;
      }
    }
    if (budgetAlertsEnabled !== undefined) {
      settings.budgetAlertsEnabled = budgetAlertsEnabled;
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

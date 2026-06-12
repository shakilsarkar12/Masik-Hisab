const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    unique: true
  },
  emailNotificationsEnabled: { 
    type: Boolean, 
    default: true 
  },
  dailyReminderEnabled: { 
    type: Boolean, 
    default: true 
  },
  dailyReminderTime: { 
    type: String, 
    default: '20:00', // Format 'HH:MM'
    trim: true
  },
  budgetAlertsEnabled: { 
    type: Boolean, 
    default: true 
  },
  lastReminderSent: { 
    type: Date, 
    default: null 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NotificationSettings', NotificationSettingsSchema);

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: { 
    type: String, 
    required: [true, 'Notification message is required'],
    trim: true
  },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'danger'], 
    default: 'info' 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: ['GROUP_INVITE', 'NEW_MESSAGE', 'NEW_POST'],
    required: true
  },

  text: {
    type: String,
    required: true
  },

  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },

  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  isRead: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
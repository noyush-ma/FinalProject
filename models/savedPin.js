const mongoose = require('mongoose');

const savedPinSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

savedPinSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SavedPin', savedPinSchema);

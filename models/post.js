const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postType: {
    type: String,
    default: 'TEXT',
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'COMBINED'] 
  },
  title: {
    type: String,
    default: 'Untitled'
  },
  textContent: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  videoUrl: { 
    type: String,
     default: null 
  },
  category: {
    type: String,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorUsername: {
    type: String,
    default: ''
  },
  
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authorUsername: {
      type: String,
      default: 'משתמש לא ידוע'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Post', postSchema);
// models/Post.js
const mongoose = require('mongoose');

// הגדרת ה-Schema של הפוסט
const postSchema = new mongoose.Schema({
  postType: {
    type: String,
    default: 'TEXT',
    enum: ['TEXT', 'IMAGE', 'COMBINED'] // תמיכה בסוגי פוסטים שונים
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
  category: {
    type: String,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// יצירת והחזרת המודל של Mongoose
// Mongoose מייצר אוטומטית שדה _id ייחודי לכל פוסט!
module.exports = mongoose.model('Post', postSchema);
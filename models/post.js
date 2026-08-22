// models/Post.js
const mongoose = require('mongoose');

// הגדרת ה-Schema של הפוסט
const postSchema = new mongoose.Schema({
  authorId: {
    type: Number,
    required: true
  },
  postType: {
    type: String,
    required: true,
    enum: ['TEXT', 'IMAGE', 'COMBINED'] // תמיכה בסוגי פוסטים שונים
  },
  title: {
    type: String,
    required: true
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
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// יצירת והחזרת המודל של Mongoose
// Mongoose מייצר אוטומטית שדה _id ייחודי לכל פוסט!
module.exports = mongoose.model('Post', postSchema);
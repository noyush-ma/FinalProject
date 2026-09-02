// models/Post.js
const mongoose = require('mongoose');

// הגדרת ה-Schema של הפוסט
const postSchema = new mongoose.Schema({
  postType: {
    type: String,
    default: 'TEXT',
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'COMBINED'] // תמיכה בסוגי פוסטים שונים
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
  // רשימת מזהי המשתמשים שעשו לייק לפוסט הזה (כדי שהלייק יישמר לצמיתות ב-MongoDB,
  // וגם כדי לדעת אם המשתמש המחובר כרגע כבר עשה לייק - למניעת לייק כפול)
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // תגובות שנכתבו על הפוסט - נשמרות לצמיתות ב-MongoDB (מוטמעות בתוך מסמך הפוסט עצמו)
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

// יצירת והחזרת המודל של Mongoose
// Mongoose מייצר אוטומטית שדה _id ייחודי לכל פוסט!
module.exports = mongoose.model('Post', postSchema);
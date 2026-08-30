// models/user.js
const mongoose = require('mongoose');

// הגדרת ה-Schema של המשתמש
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: 'icons/profileLogo.png'
  },
  bio: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// יצירת והחזרת המודל של Mongoose
// Mongoose מייצר אוטומטית שדה _id ייחודי לכל משתמש!
module.exports = mongoose.model('User', userSchema);
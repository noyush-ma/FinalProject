// models/board.js
const mongoose = require('mongoose');

// הגדרת ה-Schema של הלוח (Board) - כל לוח שייך למשתמש אחד בלבד
const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    // המשתמש שיצר את הלוח - הלוח שייך אך ורק לו
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    // תמונת תצוגה ללוח (נלקחת מהפין הראשון שנשמר אליו, אם קיים)
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// לא ניתן ליצור לאותו משתמש שני לוחות באותו שם
boardSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Board', boardSchema);

// models/savedPin.js
const mongoose = require('mongoose');

// כל מסמך מייצג "שמירה" אחת: פוסט (פין) ששמור ללוח מסוים, על ידי משתמש מסוים.
// זהו מודל ה-Join שמחבר בין Post, Board ו-User.
// השמירה היא פרטית: היא נראית אך ורק למשתמש ששמר אותה (user), ולא לאף אחד אחר -
// גם אם משתמשים אחרים רואים את אותו הפוסט בפיד, השמירה שלו ללוח נשארת אצלו בלבד.
const savedPinSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  board: {
    // הלוח שאליו הפין משויך כרגע - אופציונלי: פין יכול להיות שמור ב"סיכות" בלבד,
    // בלי להיות משויך לאף לוח (null). הסרה מלוח לא מוחקת את השמירה עצמה,
    // היא רק מאפסת את השדה הזה חזרה ל-null.
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  user: {
    // מי שביצע את השמירה - משמש גם לבדיקת הרשאה (רק הוא יכול לראות/להסיר את השמירה הזו)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// לכל משתמש, פוסט מסוים יכול להיות שמור רק פעם אחת (כלומר רק בלוח אחד בו-זמנית).
// שמירה חוזרת של אותו פוסט ללוח אחר "מזיזה" אותו במקום ליצור כפילות.
savedPinSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SavedPin', savedPinSchema);

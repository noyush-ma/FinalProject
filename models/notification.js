// מודל "התראה" - משמש כדי להציג למשתמש פופ-אפ על המסך כאשר:
// 1. מישהו מזמין אותו להצטרף לקבוצה (GROUP_INVITE)
// 2. מגיעה הודעה חדשה בקבוצה שהוא חבר בה (NEW_MESSAGE)
// הצד הלקוח "מקזז" (polling) את השרת כל כמה שניות כדי לבדוק אם יש התראות חדשות,
// ומציג אותן כהתראה קופצת עם אפשרות "לחזור אליה".
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // למי מיועדת ההתראה
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // סוג ההתראה - מזמין את סוג התוכן/הכפתורים שיוצגו למשתמש
  type: {
    type: String,
    enum: ['GROUP_INVITE', 'NEW_MESSAGE', 'NEW_POST'],
    required: true
  },

  // הטקסט שיוצג בתוך ההתראה הקופצת
  text: {
    type: String,
    required: true
  },

  // הקבוצה הרלוונטית (גם להזמנה וגם להודעה חדשה) - כדי שנוכל "לחזור אליה"
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },

  // הפוסט הרלוונטי (רק עבור NEW_POST - פוסט חדש שהעלה משתמש שאני עוקב אחריו)
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },

  // מי יצר את ההתראה (מי הזמין / מי שלח את ההודעה)
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // האם המשתמש כבר צפה/טיפל בהתראה (משמש כדי לא להציג אותה שוב בפופ-אפ)
  isRead: {
    type: Boolean,
    default: false
  },

  // רלוונטי רק להזמנות לקבוצה: PENDING (ממתין) / ACCEPTED (אושר) / DECLINED (נדחה)
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
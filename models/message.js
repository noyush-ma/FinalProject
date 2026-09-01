// מודל "הודעת צ'אט" - כל מסמך מייצג הודעה אחת שנשלחה בתוך קבוצה מסוימת.
const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  // לאיזו קבוצה שייכת ההודעה
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },

  // מי שלח את ההודעה
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // שומרים גם את שם המשתמש בנפרד, כדי שיהיה קל להציג את ההודעה
  // בצד הלקוח בלי לבצע שאילתה נוספת לשליפת שם המשתמש בכל פעם
  senderUsername: {
    type: String,
    default: ''
  },

  // תוכן ההודעה עצמה
  text: {
    type: String,
    required: true,
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
// מודל "קבוצה" - מייצג קבוצת צ'אט שיש לה שם, בעלים, רשימת חברים וקוד הצטרפות ייחודי.
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // שם הקבוצה כפי שהמשתמשים יראו אותו
  name: {
    type: String,
    required: true,
    trim: true
  },

  // מי יצר את הקבוצה (מנהל הקבוצה)
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // רשימת כל המשתמשים שנמצאים כרגע בקבוצה (כולל הבעלים)
  // שומרים מערך של ObjectId שמצביעים על מסמכי User
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // קוד הצטרפות ייחודי לקבוצה - מאפשר "להיכנס לקבוצה קיימת"
  // בלי צורך שמישהו ישלח הזמנה אישית (כמו קוד הזמנה לקבוצת וואטסאפ)
  joinCode: {
    type: String,
    required: true,
    unique: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Group', groupSchema);
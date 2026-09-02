// אחראי על שליפת ההתראות של המשתמש (כדי להציג אותן כפופ-אפ על המסך)
// ועל סימון התראה כ"נקראה" אחרי שהמשתמש טיפל בה/סגר אותה.
const Notification = require('../models/notification');

// שליפת כל ההתראות שעדיין לא נקראו עבור משתמש מסוים.
// הצד הלקוח קורא לנתיב הזה שוב ושוב (polling) כל כמה שניות
// כדי לדעת אם "קפצה" התראה חדשה שצריך להציג לו.
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.params.userId,
      isRead: false
    })
      .populate('fromUser', 'username profileImage')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// שליפת כל ההיסטוריה (גם נקראו וגם לא) עבור המודל של מרכז ההתראות
exports.getAllUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.params.userId })
      .populate('fromUser', 'username profileImage')
      .populate('group', 'name')
      .populate('post', 'title imageUrl')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// מחיקת התראה בודדת לצמיתות (למשל דרך כפתור "מחק" במרכז ההתראות)
exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.notificationId);
    if (!deleted) {
      return res.status(404).json({ message: 'התראה לא נמצאה' });
    }
    res.json({ message: 'ההתראה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// סימון התראה בודדת כ"נקראה" - למשל אחרי שהמשתמש סגר את הפופ-אפ
// או לחץ על "חזור אליה" ועבר לצפות בקבוצה/בהודעה.
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'התראה לא נמצאה' });
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
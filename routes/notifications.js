// נתיבי API עבור מערכת ההתראות הקופצות (הזמנות לקבוצה + הודעות חדשות).
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// שליפת כל ההתראות שלא נקראו עבור משתמש מסוים (משמש לפולינג/polling מהלקוח - לספירת הבאדג')
router.get('/user/:userId', notificationController.getUserNotifications);

// שליפת כל ההיסטוריה (נקראו + לא נקראו) - משמש למרכז ההתראות (המודל שנפתח מכפתור הפעמון)
router.get('/user/:userId/all', notificationController.getAllUserNotifications);

// סימון התראה כנקראה
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

// מחיקת התראה לצמיתות
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
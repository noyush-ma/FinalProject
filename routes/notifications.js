// נתיבי API עבור מערכת ההתראות הקופצות (הזמנות לקבוצה + הודעות חדשות).
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// שליפת כל ההתראות שלא נקראו עבור משתמש מסוים (משמש לפולינג/polling מהלקוח)
router.get('/user/:userId', notificationController.getUserNotifications);

// סימון התראה כנקראה
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

module.exports = router;

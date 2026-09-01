// מגדיר את כל נתיבי ה-API הקשורים לקבוצות צ'אט: יצירה, הצטרפות, הזמנות והודעות.
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// יצירת קבוצה חדשה
router.post('/', groupController.createGroup);

// שליפת כל הקבוצות ששייכות למשתמש מסוים (להצגת רשימת "הצ'אטים שלי")
router.get('/user/:userId', groupController.getUserGroups);

// הצטרפות לקבוצה קיימת לפי קוד הצטרפות
router.post('/join', groupController.joinGroupByCode);

// שליפת פרטי קבוצה בודדת (כולל רשימת חברים)
router.get('/:groupId', groupController.getGroupById);

// הזמנת משתמש קיים לקבוצה מסוימת
router.post('/:groupId/invite', groupController.inviteUserToGroup);

// תגובה להזמנה לקבוצה (אישור/דחייה) - מבוצע דרך מזהה ההתראה
router.put('/invite/:notificationId/respond', groupController.respondToInvite);

// שליפת כל ההודעות של קבוצה מסוימת
router.get('/:groupId/messages', groupController.getGroupMessages);

// שליחת הודעה חדשה בתוך קבוצה
router.post('/:groupId/messages', groupController.sendGroupMessage);

module.exports = router;
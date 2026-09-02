// מגדיר את כל נתיבי ה-API הקשורים לקבוצות צ'אט: יצירה, הצטרפות, הזמנות והודעות.
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// יצירת קבוצה חדשה
router.post('/', groupController.createGroup);

// שליפת כל הקבוצות ששייכות למשתמש מסוים (להצגת רשימת "הצ'אטים שלי")
router.get('/user/:userId', groupController.getUserGroups);

// שליפת כל הקבוצות הציבוריות שהמשתמש עדיין לא חבר בהן (להצגה במסך "קבוצות ציבוריות")
router.get('/public/:userId', groupController.getPublicGroups);

// הצטרפות לקבוצה קיימת לפי קוד הצטרפות (עובד גם לקבוצות פרטיות וגם לציבוריות)
router.post('/join', groupController.joinGroupByCode);

// שליפת פרטי קבוצה בודדת (כולל רשימת חברים)
router.get('/:groupId', groupController.getGroupById);

// הצטרפות ישירה לקבוצה ציבורית, ללא צורך בקוד או בהזמנה
router.post('/:groupId/join-public', groupController.joinPublicGroup);

// שינוי מצב פרטיות של הקבוצה (ציבורית/פרטית) - רק ע"י המנהל
router.put('/:groupId/privacy', groupController.setGroupPrivacy);

// הזמנת משתמש קיים לקבוצה מסוימת - רק ע"י המנהל
router.post('/:groupId/invite', groupController.inviteUserToGroup);

// תגובה להזמנה לקבוצה (אישור/דחייה) - מבוצע דרך מזהה ההתראה
router.put('/invite/:notificationId/respond', groupController.respondToInvite);

// שליפת כל ההודעות של קבוצה מסוימת
router.get('/:groupId/messages', groupController.getGroupMessages);

// שליחת הודעה חדשה בתוך קבוצה
router.post('/:groupId/messages', groupController.sendGroupMessage);

module.exports = router;
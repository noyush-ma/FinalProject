const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/user/:userId', notificationController.getUserNotifications);

router.get('/user/:userId/all', notificationController.getAllUserNotifications);

router.put('/:notificationId/read', notificationController.markNotificationAsRead);

router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.post('/', groupController.createGroup);

router.get('/user/:userId', groupController.getUserGroups);

router.get('/public/:userId', groupController.getPublicGroups);

router.post('/join', groupController.joinGroupByCode);

router.get('/:groupId', groupController.getGroupById);

router.post('/:groupId/join-public', groupController.joinPublicGroup);

router.put('/:groupId/privacy', groupController.setGroupPrivacy);

router.post('/:groupId/invite', groupController.inviteUserToGroup);

router.put('/invite/:notificationId/respond', groupController.respondToInvite);

router.get('/:groupId/messages', groupController.getGroupMessages);

router.post('/:groupId/messages', groupController.sendGroupMessage);

module.exports = router;
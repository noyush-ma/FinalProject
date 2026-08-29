const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

// ניהול לוחות
router.post('/', boardController.createBoard);
router.get('/user/:userId', boardController.getUserBoards);
router.get('/save-status/:postId/:userId', boardController.getSaveStatus);
router.get('/:id/pins', boardController.getBoardPins);
router.get('/:id', boardController.getBoardById);
router.put('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

// שמירה/הסרה של פוסטים מלוחות
router.post('/save', boardController.savePin);
router.post('/unsave', boardController.unsavePin);

module.exports = router;

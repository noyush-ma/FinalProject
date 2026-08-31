const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');


router.post('/', boardController.createBoard);
router.get('/user/:userId', boardController.getUserBoards);
router.get('/pins/:userId', boardController.getUserSavedPins);
router.get('/save-status/:postId/:userId', boardController.getSaveStatus);
router.get('/:id/pins', boardController.getBoardPins);
router.get('/:id', boardController.getBoardById);
router.put('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

router.post('/save', boardController.savePin);            
router.post('/add-to-board', boardController.addPinToBoard);   
router.post('/remove-from-board', boardController.removeFromBoard); 
router.post('/unsave', boardController.unsavePin);           

module.exports = router;

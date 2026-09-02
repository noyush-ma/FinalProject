const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);
router.get('/', postController.getAllPosts);
router.post('/:id/like', postController.toggleLike);
router.get('/:id', postController.getPostById);
router.delete('/:id', postController.deletePost);
router.put('/:id', postController.updatePost);

module.exports = router;
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/stats/by-category', postController.getPostCountsByCategory);
router.get('/following/:userId', postController.getFollowingPosts);
router.post('/:id/like', postController.toggleLike);
router.post('/:id/comments', postController.addComment);
router.delete('/:id/comments/:commentId', postController.deleteComment);
router.get('/:id', postController.getPostById);
router.delete('/:id', postController.deletePost);
router.put('/:id', postController.updatePost);

module.exports = router;
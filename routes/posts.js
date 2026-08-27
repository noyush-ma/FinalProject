const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// 1. יצירת פוסט חדש (POST /api/posts)
router.post('/', async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      imgUrl: req.body.imgUrl,
      description: req.body.description
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 2. שליפת כל הפוסטים (GET /api/posts)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. שליפת פוסט יחיד לפי מזהה (GET /api/posts/:id)
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. מחיקת פוסט לפי מזהה (DELETE /api/posts/:id)
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'פוסט לא נמצא' });
    }
    res.json({ message: 'הפוסט נמחק בהצלחה', deletedPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
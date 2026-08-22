// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 1. CREATE - יצירת פוסט חדש (POST /api/posts)
router.post('/', (req, res) => {
  try {
    const newPost = Post.create(req.body);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. LIST - הצגת כל הפוסטים (GET /api/posts)
router.get('/', (req, res) => {
  const allPosts = Post.getAll();
  res.json(allPosts);
});

// 3. SEARCH - חיפוש וסינון פוסטים (GET /api/posts/search)
// דוגמת שימוש: /api/posts/search?category=Home&startDate=2026-01-01
router.get('/search', (req, res) => {
  const { category, startDate, endDate } = req.query;
  const results = Post.search({ category, startDate, endDate });
  res.json(results);
});

// 4. UPDATE - עדכון פוסט לפי ID (PUT /api/posts/:id)
router.put('/:id', (req, res) => {
  const updatedPost = Post.update(req.params.id, req.body);
  if (!updatedPost) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(updatedPost);
});

// 5. DELETE - מחיקת פוסט לפי ID (DELETE /api/posts/:id)
router.delete('/:id', (req, res) => {
  const success = Post.delete(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ message: 'Post deleted successfully' });
});

module.exports = router;
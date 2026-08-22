// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 1. CREATE - יצירת פוסט חדש
router.post('/', async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. LIST - הצגת כל הפוסטים
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. SEARCH - חיפוש וסינון פוסטים לפי קטגוריה ו/או תאריכים
router.get('/search', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let filter = {};

    if (category) {
      filter.category = new RegExp(category, 'i'); // חיפוש לא רגיש לאותיות גדולות/קטנות
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const results = await Post.find(filter);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. UPDATE - עדכון פוסט לפי ID
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. DELETE - מחיקת פוסט לפי ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
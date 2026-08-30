const express = require('express');
const mongoose = require('mongoose'); // 1. ייבוא mongoose
const app = express();

const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const boardsRouter = require('./routes/boards');

app.use(express.static('public'));
app.use(express.json({limit: '10mb'})); // הגבלת גודל הבקשה ל-10MB

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/boards', boardsRouter);

app.get('/', (req, res) => {
  res.send('success!');
});

// 2. חיבור ל-MongoDB (מקומי או מרוחק)
const MONGO_URI = 'mongodb+srv://noya8657_db_user:noya8657DB@cluster0.5i8zsqf.mongodb.net/pinterest_db?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

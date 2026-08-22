const express = require('express');
const mongoose = require('mongoose'); // 1. ייבוא mongoose
const app = express();

const postsRouter = require('./routes/posts');

app.use(express.static('public'));
app.use(express.json());

app.use('/api/posts', postsRouter);

app.get('/', (req, res) => {
  res.send('success!');
});

// 2. חיבור ל-MongoDB (מקומי או מרוחק)
const MONGO_URI = 'mongodb://127.0.0.1:27017/pinterest_db'; // שם בסיס הנתונים

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
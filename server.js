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
const MONGO_URI = 'mongodb+srv://noya8657_db_user:<db_password>@cluster0.5i8zsqf.mongodb.net/?appName=Cluster0'; // שם בסיס הנתונים

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
const express = require('express');
const app = express();

const postsRouter = require('./routes/posts'); // ייבוא הנתיבים של הפוסטים

app.use(express.static('public'));
app.use(express.json());

// חיבור ה-Router של הפוסטים תחת התיקייה /api/posts
app.use('/api/posts', postsRouter);

app.get('/', (req, res) => {
  res.send('success!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
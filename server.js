require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); 
const app = express();

const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const boardsRouter = require('./routes/boards');
const groupsRouter = require('./routes/groups'); 
const notificationsRouter = require('./routes/notifications'); 
const weatherRouter = require('./routes/weather');

app.use(express.static('public'));
app.use(express.json({limit: '10mb'})); 

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/weather', weatherRouter);

const locationsRouter = require('./routes/locations');
app.use('/api/locations', locationsRouter);

app.get('/', (req, res) => {
  res.send('success!');
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on http://localhost:3000');
});

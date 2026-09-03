// routes/weather.js
// נתיב API שמפעיל את הקריאה לשירות ה-Web החיצוני (Open-Meteo) דרך השרת שלנו
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/', weatherController.getWeather);

module.exports = router;
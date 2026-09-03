// controllers/weatherController.js
// שירות Web חיצוני אמיתי: פנייה ל-Open-Meteo (API חינמי, ללא צורך במפתח/רישום)
// שלב 1: Geocoding - המרת שם עיר שהוזן ע"י המשתמש לקואורדינטות (lat/lon)
// שלב 2: Forecast - שליפת מזג האוויר הנוכחי לפי אותן קואורדינטות
// שני השלבים מתבצעים בפועל מהשרת שלנו (Node) בעזרת fetch המובנה, ולא באמצעות iframe
// או קוד מוכן מראש - השרת שלנו הוא זה שפונה, מקבל תשובה, ומחזיר אותה מעובדת ללקוח.

exports.getWeather = async (req, res) => {
  try {
    const city = (req.query.city || '').trim();
    if (!city) {
      return res.status(400).json({ message: 'יש לספק שם עיר (פרמטר city)' });
    }

    // --- שלב 1: קריאה ל-Web Service של Open-Meteo כדי להמיר שם עיר לקואורדינטות ---
    const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(city) + '&count=1&language=he&format=json';

    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      return res.status(502).json({ message: 'שגיאה בפנייה לשירות המיקום (Geocoding)' });
    }
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ message: 'לא נמצאה עיר בשם "' + city + '"' });
    }

    const location = geoData.results[0];
    const latitude = location.latitude;
    const longitude = location.longitude;

    // --- שלב 2: קריאה בפועל ל-Web Service החיצוני שמחזיר את מזג האוויר הנוכחי ---
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + latitude +
      '&longitude=' + longitude + '&current_weather=true';

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      return res.status(502).json({ message: 'שגיאה בפנייה לשירות מזג האוויר' });
    }
    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) {
      return res.status(502).json({ message: 'שירות מזג האוויר לא החזיר נתונים תקינים' });
    }

    // עיבוד וחזרה ללקוח רק עם השדות הרלוונטיים (זו הדוגמה ל"לקבל נתונים בחזרה ולהציג אותם")
    res.json({
      city: location.name,
      country: location.country || '',
      temperature: weatherData.current_weather.temperature,
      windspeed: weatherData.current_weather.windspeed,
      weathercode: weatherData.current_weather.weathercode,
      time: weatherData.current_weather.time
    });
  } catch (err) {
    console.error('שגיאה בשירות מזג האוויר:', err);
    res.status(500).json({ message: 'שגיאת שרת בעת פנייה לשירות מזג האוויר החיצוני' });
  }
};
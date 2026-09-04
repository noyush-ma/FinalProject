const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({});
    console.log('מיקומים שנשלחו מהשרת:', locations); 
    res.json(locations);
  } catch (err) {
    console.error('שגיאה במסד הנתונים:', err.message); 
    res.status(500).json({ message: 'שגיאה בטעינת המיקומים', error: err.message });
  }
});

module.exports = router;

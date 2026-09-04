const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בטעינת המיקומים', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, lat, lng, category } = req.body;

    if (!name || !address || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'חסרים שדות חובה: name, address, lat, lng' });
    }

    const newLocation = new Location({ name, address, lat, lng, category });
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשמירת המיקום', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, lat, lng, category } = req.body;
    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { name, address, lat, lng, category },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'מיקום לא נמצא' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון המיקום', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Location.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'מיקום לא נמצא' });
    res.json({ message: 'המיקום נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה במחיקת המיקום', error: err.message });
  }
});

module.exports = router;
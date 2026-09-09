const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Telemetry Schema writing to 'analytics' collection
const TelemetrySchema = new mongoose.Schema({
  metricName: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Telemetry = mongoose.models.Telemetry || mongoose.model('Telemetry', TelemetrySchema, 'analytics');

// POST /api/telemetry
router.post('/', async (req, res) => {
  try {
    const { metricName, value } = req.body;
    
    if (!metricName || value === undefined) {
      return res.status(400).json({ success: false, message: 'metricName and value are required.' });
    }

    const newEntry = new Telemetry({ metricName, value });
    await newEntry.save();

    return res.status(201).json({
      success: true,
      message: 'Telemetry data successfully ingested.',
      data: newEntry
    });
  } catch (error) {
    console.error('[Telemetry Ingestion Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
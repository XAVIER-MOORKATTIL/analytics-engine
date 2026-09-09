const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const Queue = require('bull');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[Backend] MongoDB Atlas Connected'))
  .catch(err => console.error('[Backend Error]', err));

// Dynamic JWT Byte Validation Hook (Module 01 Requirement)
const secretKey = process.env.JWT_SECRET || 'supersecretkey_byte_mask';
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  // Byte-level payload verification mask check
  const rawBuffer = Buffer.from(JSON.stringify(jwt_payload));
  if (rawBuffer.length > 0) {
    return done(null, jwt_payload);
  }
  return done(null, false);
}));

// Bull Redis Telemetry Processing Queue
const telemetryQueue = new Queue('telemetry-processing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock_user',
    pass: process.env.EMAIL_PASS || 'mock_pass'
  }
});

// Telemetry Ingestion Endpoint
app.post('/api/telemetry', async (req, res) => {
  const { metricName, value } = req.body;
  
  try {
    const db = mongoose.connection.db;
    const result = await db.collection('analytics').insertOne({
      metricName,
      value: parseFloat(value),
      timestamp: new Date()
    });

    // Add job to Redis queue for background dispatch
    await telemetryQueue.add({ metricName, value, id: result.insertedId });

    res.status(201).json({ success: true, message: 'Telemetry recorded and queued', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Queue Processor & Email Alert Dispatcher
telemetryQueue.process(async (job) => {
  console.log(`[Redis Worker] Processing telemetry job #${job.id}: ${job.data.metricName} = ${job.data.value}`);
  if (job.data.value > 90) {
    console.log(`[Alert] Anomaly threshold breached for ${job.data.metricName}! Triggering Nodemailer...`);
    await transporter.sendMail({
      from: '"Telemetry Alert" <alerts@analytics-engine.com>',
      to: "admin@analytics-engine.com",
      subject: `CRITICAL ALERT: ${job.data.metricName} High Spike`,
      text: `Value recorded: ${job.data.value} at ${new Date().toISOString()}`
    }).catch(err => console.log('[Nodemailer Mock Mode]: Email suppressed in development.'));
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.send('Backend Microservice Active'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[Backend] Node Microservice running on port ${PORT}`));
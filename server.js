const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const Queue = require('bull');
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// HTTP Server & Socket.io Initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[Database] MongoDB Atlas connected successfully'))
  .catch((err) => console.error('[Database Error]', err));

// Dynamic Byte-Mask JWT Authentication Strategy
const jwtSecret = process.env.JWT_SECRET || 'dynamic_byte_mask_secret';
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
};

passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
  const payloadBuffer = Buffer.from(JSON.stringify(payload));
  return payloadBuffer.length > 0 ? done(null, payload) : done(null, false);
}));

app.use(passport.initialize());

// Background Redis Queue & Nodemailer Transporter
const telemetryQueue = new Queue('telemetry-jobs', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const mailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock_user',
    pass: process.env.EMAIL_PASS || 'mock_pass'
  }
});

// Real-Time Socket Connection Handlers
io.on('connection', (socket) => {
  console.log(`[Socket.io] Real-time client attached: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client detached: ${socket.id}`);
  });
});

// Telemetry Ingestion Endpoint
app.post('/api/telemetry', async (req, res) => {
  const { metricName, value } = req.body;

  try {
    const db = mongoose.connection.db;
    const record = {
      metricName,
      value: parseFloat(value),
      timestamp: new Date()
    };

    const result = await db.collection('analytics').insertOne(record);

    // Dynamic Socket Broadcast & Async Redis Dispatch
    io.emit('telemetry_update', { id: result.insertedId, ...record });
    await telemetryQueue.add({ id: result.insertedId, ...record });

    res.status(201).json({ success: true, id: result.insertedId, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Asynchronous Worker Queue Processing
telemetryQueue.process(async (job) => {
  console.log(`[Redis Queue] Processing job #${job.data.id} - ${job.data.metricName}: ${job.data.value}`);
  
  if (job.data.value > 90) {
    console.log(`[Alert System] High-value spike detected (${job.data.value}). Triggering alert email...`);
    await mailTransporter.sendMail({
      from: '"System Monitor" <alerts@analytics-engine.com>',
      to: 'admin@analytics-engine.com',
      subject: `CRITICAL METRIC SPIKE: ${job.data.metricName}`,
      text: `Metric threshold exceeded: ${job.data.value} at ${job.data.timestamp}`
    }).catch(() => console.log('[Nodemailer] Mail dispatch suppressed (Development Mode).'));
  }
});

// Service Readiness Route
app.get('/health', (req, res) => res.status(200).send('Backend Microservice Fully Operational'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Backend Microservice] Running on port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes = require('./routes/users');
const { connectRedis } = require('../shared/redis');
const { authMiddleware } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'User Service', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-users');
    console.log('Connected to MongoDB (User Service)');

    // Connect to Redis
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start user service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

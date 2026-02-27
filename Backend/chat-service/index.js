const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });

const chatRoutes = require('./routes/chat');
const { connectRedis } = require('../shared/redis');
const { connectKafka, subscribeToMessages } = require('../shared/kafka');
const { authMiddleware } = require('../shared/auth');
const SocketHandler = require('./services/socketService');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3003;

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // More generous for chat service
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Chat Service', timestamp: new Date().toISOString() });
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
    await mongoose.connect(process.env.MONGODB_URI_CHAT || 'mongodb://localhost:27017/chat-messages');
    console.log('Connected to MongoDB (Chat Service)');

    // Connect to Redis
    await connectRedis();

    // Connect to Kafka
    await connectKafka();
    
    // Subscribe to message topics
    subscribeToMessages('chat-service', ['messages', 'notifications'], async (topic, message) => {
      console.log(`Received message on topic ${topic}:`, message);
      
      if (topic === 'messages') {
        // Handle real-time message broadcasting
        io.to(message.chatId).emit('message', message);
      } else if (topic === 'notifications') {
        // Handle notifications
        io.to(`user:${message.userId}`).emit('notification', message);
      }
    });

    // Initialize Socket.io handlers
    const socketHandler = new SocketHandler(io);
    socketHandler.initialize();

    server.listen(PORT, () => {
      console.log(`Chat Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start chat service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };

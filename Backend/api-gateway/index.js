const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for gateway
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3003',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3004'
};

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: 'The requested service is not responding'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info if available
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    }
  }
};

// Route proxying
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

app.use('/api/users', createProxyMiddleware({
  ...proxyOptions,
  target: services.user,
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

app.use('/api/chat', createProxyMiddleware({
  ...proxyOptions,
  target: services.chat,
  pathRewrite: {
    '^/api/chat': '/api/chat'
  }
}));

app.use('/api/media', createProxyMiddleware({
  ...proxyOptions,
  target: services.media,
  pathRewrite: {
    '^/api/media': '/api/media'
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthChecks = {
    gateway: { status: 'OK', timestamp: new Date().toISOString() },
    services: {}
  };

  // Check each service health
  const axios = require('axios');
  const checkService = async (name, url) => {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      return { status: 'OK', data: response.data };
    } catch (error) {
      return { 
        status: 'ERROR', 
        error: error.message,
        code: error.code || 'UNKNOWN'
      };
    }
  };

  await Promise.all([
    checkService('auth', services.auth),
    checkService('user', services.user),
    checkService('chat', services.chat),
    checkService('media', services.media)
  ]).then(results => {
    healthChecks.services.auth = results[0];
    healthChecks.services.user = results[1];
    healthChecks.services.chat = results[2];
    healthChecks.services.media = results[3];
  }).catch(error => {
    console.error('Health check error:', error);
  });

  // Determine overall health
  const allServicesHealthy = Object.values(healthChecks.services)
    .every(service => service.status === 'OK');
  
  const statusCode = allServicesHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    ...healthChecks,
    overall: allServicesHealthy ? 'HEALTHY' : 'DEGRADED'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Chat App API Gateway',
    version: '1.0.0',
    description: 'Microservices API Gateway for Chat Application',
    services: {
      auth: {
        baseUrl: '/api/auth',
        description: 'Authentication and user management',
        endpoints: [
          'GET /api/auth/google - Google OAuth login',
          'GET /api/auth/me - Get current user',
          'POST /api/auth/refresh - Refresh access token',
          'POST /api/auth/logout - Logout user',
          'PATCH /api/auth/profile - Update user profile'
        ]
      },
      users: {
        baseUrl: '/api/users',
        description: 'User profiles and suggestions',
        endpoints: [
          'GET /api/users/suggestions - Get suggested users',
          'GET /api/users/profile - Get user profile',
          'PATCH /api/users/profile - Update profile',
          'PATCH /api/users/status - Update user status',
          'POST /api/users/block/:userId - Block user',
          'GET /api/users/search - Search users'
        ]
      },
      chat: {
        baseUrl: '/api/chat',
        description: 'Chat and messaging functionality',
        endpoints: [
          'POST /api/chat/chats - Create new chat',
          'GET /api/chat/chats - Get user chats',
          'GET /api/chat/chats/:chatId - Get chat details',
          'GET /api/chat/chats/:chatId/messages - Get chat messages',
          'POST /api/chat/chats/:chatId/messages - Send message',
          'GET /api/chat/chats/:chatId/search - Search messages'
        ]
      },
      media: {
        baseUrl: '/api/media',
        description: 'File and media upload service',
        endpoints: [
          'POST /api/media/upload/profile - Upload profile image',
          'POST /api/media/upload/chat - Upload chat media',
          'POST /api/media/upload/image - Upload and optimize image',
          'DELETE /api/media/delete/:publicId - Delete media file',
          'GET /api/media/info/:publicId - Get file info'
        ]
      }
    },
    websocket: {
      url: services.chat.replace('http', 'ws'),
      description: 'Real-time chat functionality via Socket.IO',
      events: [
        'join_chat - Join chat room',
        'send_message - Send message',
        'typing_start/stop - Typing indicators',
        'mark_read - Mark message as read',
        'add_reaction - Add message reaction'
      ]
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      '/api/auth/*',
      '/api/users/*',
      '/api/chat/*',
      '/api/media/*',
      '/health',
      '/api'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Gateway error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
});

module.exports = app;

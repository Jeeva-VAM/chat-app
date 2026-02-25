# Chat App Backend - Microservices Architecture

A scalable, secure chat application backend built with Node.js microservices, featuring real-time messaging, end-to-end encryption, and comprehensive media handling.

## 🏗️ Architecture Overview

This backend consists of 5 microservices:

1. **API Gateway** (Port 3000) - Routes requests and handles load balancing
2. **Auth Service** (Port 3001) - OAuth authentication and user management
3. **User Service** (Port 3002) - User profiles and suggestions
4. **Chat Service** (Port 3003) - Real-time messaging with WebSocket and encryption
5. **Media Service** (Port 3004) - File uploads via Cloudinary

## 🚀 Features

### Authentication & Security
- OAuth 2.0 with Google integration
- JWT-based authentication with refresh tokens
- Rate limiting and security headers
- End-to-end message encryption
- User session management

### Chat Features
- Real-time messaging with WebSocket (Socket.IO)
- Direct and group chats
- Message encryption/decryption
- Message reactions and replies
- Typing indicators
- Message read receipts
- File and media sharing
- Message search functionality

### User Management
- User profile management
- Profile image upload and editing
- User suggestions (excluding blocked users)
- User blocking/unblocking
- Online/offline status
- User search

### Media Handling
- Profile image uploads
- Chat media uploads (images, videos, documents)
- Automatic image optimization
- Cloudinary integration
- File size and type validation

### Infrastructure
- MongoDB Atlas for data storage
- Redis for caching and session storage
- Apache Kafka for message queuing
- Docker containerization
- Microservices communication

## 🛠️ Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB Atlas account
- Cloudinary account
- Google OAuth 2.0 credentials

## 📦 Installation

### 1. Clone and Install Dependencies

```bash
cd Backend
npm run install:all
```

### 2. Environment Configuration

Update `.env` file with your credentials:

```env
# Required: Update these values
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Atlas (update if using Atlas)
MONGODB_URI_AUTH=mongodb+srv://username:password@cluster.mongodb.net/chat-auth
MONGODB_URI_USER=mongodb+srv://username:password@cluster.mongodb.net/chat-users
MONGODB_URI_CHAT=mongodb+srv://username:password@cluster.mongodb.net/chat-messages

# Cloudinary (already configured)
CLOUDINARY_API=715391784418838
CLOUDINARY_SECRET=zEQuy6n-Q-8Pd4O8zdmHeVquDQg
CLOUD_NAME=dxplpbgkd
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

### 4. Start Services

#### Option A: Docker (Recommended)
```bash
docker-compose up -d
```

#### Option B: Local Development
```bash
# Start infrastructure (MongoDB, Redis, Kafka)
docker-compose up -d mongodb redis zookeeper kafka

# Start all services
npm run dev
```

#### Option C: Individual Services
```bash
# Terminal 1 - Auth Service
npm run dev:auth

# Terminal 2 - User Service
npm run dev:user

# Terminal 3 - Chat Service
npm run dev:chat

# Terminal 4 - Media Service
npm run dev:media

# Terminal 5 - API Gateway
npm run dev:gateway
```

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Google OAuth Login
```
GET /api/auth/google
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

#### Refresh Token
```
POST /api/auth/refresh
Body: { "refreshToken": "..." }
```

#### Update Profile
```
PATCH /api/auth/profile
Headers: Authorization: Bearer <token>
Body: { "name": "...", "profileImage": "..." }
```

### User Endpoints

#### Get User Suggestions
```
GET /api/users/suggestions?page=1&limit=20&search=query
Headers: Authorization: Bearer <token>
```

#### Update User Profile
```
PATCH /api/users/profile
Headers: Authorization: Bearer <token>
Body: { "name": "...", "bio": "...", "preferences": {...} }
```

#### Block/Unblock User
```
POST /api/users/block/:userId
DELETE /api/users/block/:userId
Headers: Authorization: Bearer <token>
```

### Chat Endpoints

#### Create Chat
```
POST /api/chat/chats
Headers: Authorization: Bearer <token>
Body: {
  "participants": [{"userId": "...", "name": "..."}],
  "chatType": "direct|group",
  "chatName": "..." (for groups)
}
```

#### Get User Chats
```
GET /api/chat/chats?page=1&limit=20
Headers: Authorization: Bearer <token>
```

#### Get Chat Messages
```
GET /api/chat/chats/:chatId/messages?page=1&limit=50
Headers: Authorization: Bearer <token>
```

#### Send Message
```
POST /api/chat/chats/:chatId/messages
Headers: Authorization: Bearer <token>
Body: {
  "content": "message text",
  "messageType": "text|image|file",
  "attachments": [...] (optional)
}
```

### Media Endpoints

#### Upload Profile Image
```
POST /api/media/upload/profile
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: { "profileImage": <file> }
```

#### Upload Chat Media
```
POST /api/media/upload/chat
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: { "files": <files[]> }
```

## 🔌 WebSocket Events

Connect to: `ws://localhost:3003`

### Client Events
```javascript
// Join a chat room
socket.emit('join_chat', { chatId: '...' });

// Send message
socket.emit('send_message', {
  chatId: '...',
  content: 'Hello!',
  messageType: 'text'
});

// Typing indicators
socket.emit('typing_start', { chatId: '...' });
socket.emit('typing_stop', { chatId: '...' });

// Mark message as read
socket.emit('mark_read', { messageId: '...' });

// Add reaction
socket.emit('add_reaction', { messageId: '...', emoji: '👍' });
```

### Server Events
```javascript
// New message received
socket.on('new_message', (message) => {});

// User typing
socket.on('user_typing', ({ userId, userName }) => {});

// Message read
socket.on('message_read', ({ messageId, readBy }) => {});

// User status changes
socket.on('user_status_changed', ({ userId, status }) => {});
```

## 🛡️ Security Features

### Message Encryption
- All messages are encrypted before storage using AES-256-CBC
- Each chat has a unique encryption key
- Messages are decrypted only when retrieved by authorized users

### Authentication Security
- JWT tokens with short expiration (1 hour)
- Refresh tokens with longer expiration (7 days)
- Token rotation on refresh
- Session management with Redis

### API Security
- Rate limiting (per IP)
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- File upload restrictions

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```
GET /health
```

Response includes status of all services:
```json
{
  "gateway": { "status": "OK" },
  "services": {
    "auth": { "status": "OK" },
    "user": { "status": "OK" },
    "chat": { "status": "OK" },
    "media": { "status": "OK" }
  },
  "overall": "HEALTHY"
}
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=<strong-secret-key>
ENCRYPTION_KEY=<32-character-key>
MONGODB_URI_AUTH=mongodb+srv://...
REDIS_URL=redis://...
KAFKA_BROKERS=kafka1:9092,kafka2:9092
FRONTEND_URL=https://yourdomain.com
```

### Docker Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Configuration Example
```nginx
upstream chat_backend {
    server localhost:3000;
}

upstream chat_websocket {
    server localhost:3003;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://chat_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://chat_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB Atlas connection string
   - Ensure IP whitelist includes your IP
   - Verify username/password

2. **Google OAuth Error**
   - Verify client ID and secret
   - Check redirect URIs in Google Console
   - Ensure domains are authorized

3. **Cloudinary Upload Failed**
   - Verify API credentials
   - Check file size limits
   - Ensure supported file types

4. **WebSocket Connection Failed**
   - Check if port 3003 is accessible
   - Verify JWT token in connection
   - Check CORS settings

### Logs
```bash
# View service logs
docker-compose logs -f auth-service
docker-compose logs -f chat-service

# View all logs
docker-compose logs -f
```

## 🔄 Development Workflow

### Adding New Features
1. Create feature branch
2. Implement changes in relevant service
3. Update API documentation
4. Add tests
5. Update Docker configurations if needed

### Database Migrations
```bash
# Connect to MongoDB and run migrations
mongo "mongodb://localhost:27017/chat-auth"
```

### Testing
```bash
# Run tests for specific service
cd auth-service && npm test

# Run integration tests
npm run test:integration
```

## 📋 API Rate Limits

- General API: 1000 requests per 15 minutes
- Auth endpoints: 100 requests per 15 minutes
- Media uploads: 50 uploads per 15 minutes
- WebSocket connections: No limit (but authenticated)

## 📝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

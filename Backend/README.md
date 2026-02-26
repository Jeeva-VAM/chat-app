# 🚀 Chat App Backend - Complete Setup Guide

A scalable, secure chat application backend built with Node.js microservices, featuring real-time messaging, end-to-end encryption, and comprehensive media handling.

> **✅ Status**: Production-ready backend with 5 microservices running successfully!

## 🏗️ Architecture Overview

This backend consists of 5 microservices:

1. **API Gateway** (Port 8000) - Routes requests and handles load balancing
2. **Auth Service** (Port 3001) - OAuth authentication and user management
3. **User Service** (Port 3002) - User profiles and suggestions
4. **Chat Service** (Port 3003) - Real-time messaging with WebSocket and encryption
5. **Media Service** (Port 3004) - File uploads via Cloudinary

## ⚡ Quick Start (For New Developers)

### 🔥 Super Fast Setup

```bash
# 1. Clone the repository
git clone https://github.com/Jeeva-VAM/chat-app.git
cd chat-app/Backend

# 2. Install everything at once
npm install && npm run install:all

# 3. Copy environment file
cp .env .env.backup  # backup existing config

# 4. Start all services
npm run dev
```

**✅ Expected Result**: All 5 services should start successfully:
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:3001  
- User Service: http://localhost:3002
- Chat Service: http://localhost:3003
- Media Service: http://localhost:3004

## 🚀 Features

### Authentication & Security
- ✅ Google OAuth 2.0 integration (complete setup)
- ✅ JWT-based authentication with refresh tokens
- ✅ Rate limiting and security headers
- ✅ End-to-end message encryption
- ✅ User session management

### Chat Features
- ✅ Real-time messaging with WebSocket (Socket.IO)
- ✅ Direct and group chats
- ✅ Message encryption/decryption
- ✅ Message reactions and replies
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ File and media sharing
- ✅ Message search functionality

### User Management
- ✅ User profile management
- ✅ Profile image upload and editing
- ✅ User suggestions (excluding blocked users)
- ✅ User blocking/unblocking
- ✅ Online/offline status
- ✅ User search

### Media Handling
- ✅ Profile image uploads
- ✅ Chat media uploads (images, videos, documents)
- ✅ Automatic image optimization
- ✅ Cloudinary integration
- ✅ File size and type validation

### Infrastructure
- ✅ MongoDB Atlas for data storage
- ✅ Redis API integration (Upstash/Redis Cloud compatible)
- ✅ Optional Apache Kafka for message queuing
- ✅ No Docker dependencies (simplified deployment)
- ✅ Microservices communication
- Redis for caching and session storage
- Apache Kafka for message queuing
- Docker containerization
- Microservices communication

## 🛠️ Prerequisites

**Required:**
- ✅ Node.js 18+ (for running the backend)
- ✅ MongoDB Atlas account (already configured with credentials)
- ✅ Google OAuth 2.0 credentials (setup guide below)
- ✅ Cloudinary account (already configured)

**Optional:**
- 🔹 Redis API service (Upstash, Redis Cloud, or similar)
- 🔹 Apache Kafka (for message queuing)

**Not Required:**
- ❌ Docker (removed for simplicity)
- ❌ Local Redis installation

### 📋 Credential Setup Guide

#### 1. MongoDB Atlas (Already Done ✅)
Current configuration works with provided credentials. For new setup:
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create cluster named `Cluster0` 
- Create user: `razakdev07_db_user`
- Get connection string format: `mongodb+srv://username:password@cluster0.yymd2cc.mongodb.net/dbname`

#### 2. Google OAuth 2.0 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google+ API** and **Google OAuth2 API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Web Application**
6. **Authorized JavaScript origins**: `http://localhost:5173`
7. **Authorized redirect URIs**: `http://localhost:8000/api/auth/google/callback`
8. Copy **Client ID** and **Client Secret** to `.env` file

#### 3. Cloudinary Setup (Already Done ✅)
Current configuration works. For new setup:
- Create account at [Cloudinary](https://cloudinary.com/)
- Get **API Key**, **API Secret**, and **Cloud Name** from dashboard

#### 4. Redis API Setup (Optional)
Choose any Redis API service:

**Option A: Upstash (Recommended)**
1. Go to [upstash.com](https://upstash.com) → Create account
2. Create Redis database
3. Copy **REST URL** and **REST Token**
4. Add to `.env`: 
   ```
   REDIS_API_URL=https://your-region-12345.upstash.io
   REDIS_API_TOKEN=your_token_here
   ```

**Option B: Redis Cloud**
1. Go to [redis.com](https://redis.com) → Free account
2. Create database with REST API enabled
3. Get endpoint URL and token
4. Add to `.env` file

**Option C: No Redis**
- Backend works perfectly without Redis
- Caching will be disabled but all features work

## 📦 Installation & Setup

### 🚀 Method 1: One-Command Setup (Easiest)

```bash
# Clone and setup everything
git clone https://github.com/Jeeva-VAM/chat-app.git
cd chat-app/Backend
npm install && npm run install:all && npm run dev
```

### 📝 Method 2: Step-by-Step Setup

#### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/Jeeva-VAM/chat-app.git
cd chat-app/Backend

# Install root dependencies
npm install

# Install all service dependencies at once
npm run install:all
```

#### Step 2: Environment Configuration

**Quick Setup (Use Existing Config):**
```bash
# The .env file is already configured, just start the services
npm run dev
```

**Custom Setup (For Your Own Credentials):**
```bash
# Create backup of current config
cp .env .env.backup

# Edit with your credentials
notepad .env  # Windows
# or
code .env     # VS Code
```

#### Step 3: Update Environment Variables

```env
# 🔑 REQUIRED: Update these with your credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# 🔑 SECURITY: Change these for production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this
ENCRYPTION_KEY=your-32-character-encryption-key-here

# ✅ WORKING: MongoDB Atlas (already configured)
MONGODB_URI_AUTH=mongodb+srv://razakdev07_db_user:razakmongodb07@cluster0.yymd2cc.mongodb.net/chat-auth?retryWrites=true&w=majority
MONGODB_URI_USER=mongodb+srv://razakdev07_db_user:razakmongodb07@cluster0.yymd2cc.mongodb.net/chat-users?retryWrites=true&w=majority  
MONGODB_URI_CHAT=mongodb+srv://razakdev07_db_user:razakmongodb07@cluster0.yymd2cc.mongodb.net/chat-messages?retryWrites=true&w=majority

# ✅ WORKING: Cloudinary (already configured)
CLOUDINARY_API=715391784418838
CLOUDINARY_SECRET=zEQuy6n-Q-8Pd4O8zdmHeVquDQg
CLOUD_NAME=dxplpbgkd

# 🔹 OPTIONAL: Redis API (for caching)
REDIS_API_URL=https://your-redis-endpoint.upstash.io
REDIS_API_TOKEN=your_redis_token_here

# ⚙️ SERVICE CONFIGURATION (already set)
PORT=3000
API_GATEWAY_PORT=8000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```
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

## 🐛 Troubleshooting & FAQ

### 🚨 Common Issues & Solutions

#### 1. **Port Already in Use (EADDRINUSE)**
```bash
# Kill processes on specific ports
npx kill-port 8000 3001 3002 3003 3004

# Or kill all Node processes
taskkill /f /im node.exe  # Windows
```

#### 2. **MongoDB Connection Failed**
**Symptoms:** `MongoNetworkError` or connection timeout
**Solutions:**
- ✅ Check internet connection
- ✅ Verify MongoDB Atlas credentials in `.env`
- ✅ Whitelist your IP in MongoDB Atlas Network Access
- ✅ Check if connection string format is correct

```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('your_connection_string')
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌ Failed:', err.message));
"
```

#### 3. **Google OAuth Not Working**
**Symptoms:** OAuth redirect fails or "invalid client" error
**Solutions:**
- ✅ Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- ✅ Verify redirect URIs in Google Console:
  - `http://localhost:8000/api/auth/google/callback`
  - `http://localhost:5173` (frontend)
- ✅ Enable Google+ API in Google Cloud Console
- ✅ Check authorized JavaScript origins

#### 4. **Services Won't Start**
**Symptoms:** Errors during `npm run dev`
**Solutions:**
```bash
# Clean install all dependencies
npm run clean:install

# Or manually clean each service
rm -rf node_modules */node_modules
npm install && npm run install:all
```

#### 5. **Redis API Connection Issues**
**Symptoms:** `REDIS_CONNECTION_FAILED` logs
**Solutions:**
- ✅ Redis is optional - backend works without it
- ✅ Check `REDIS_API_URL` and `REDIS_API_TOKEN` in `.env`
- ✅ Test Redis API endpoint manually:

```bash
# Test Redis API connection
curl -X GET "YOUR_REDIS_API_URL/get/test" \
  -H "Authorization: Bearer YOUR_REDIS_TOKEN"
```

#### 6. **Cloudinary Upload Failed**
**Symptoms:** Media uploads return 401/403 errors
**Solutions:**
- ✅ Verify `CLOUDINARY_API`, `CLOUDINARY_SECRET`, `CLOUD_NAME`
- ✅ Check Cloudinary dashboard for correct credentials
- ✅ Ensure file size under limits (10MB default)

#### 7. **Frontend Can't Connect**
**Symptoms:** CORS errors or connection refused
**Solutions:**
- ✅ Start frontend on `http://localhost:5173`
- ✅ Verify `FRONTEND_URL` and `CORS_ORIGIN` in `.env`
- ✅ Check API Gateway is running on port 8000
- ✅ Update frontend API base URL to `http://localhost:8000`

### 🛠️ Debugging Commands

```bash
# Check which processes are using ports
netstat -ano | findstr "8000"  # Windows
lsof -i :8000                  # Linux/Mac

# Test individual service health
curl http://localhost:3001/health  # Auth service
curl http://localhost:3002/health  # User service
curl http://localhost:3003/health  # Chat service
curl http://localhost:3004/health  # Media service
curl http://localhost:8000/health  # API Gateway

# View detailed logs
npm run dev -- --verbose

# Test database connections
node -e "require('./shared/database').testConnections()"
```

### 📊 Performance Tips

1. **Optimize MongoDB Queries**
   - Use indexes for frequently queried fields
   - Implement pagination for large datasets

2. **Redis Caching**
   - Enable Redis API for better performance
   - Cache frequently accessed user data

3. **File Upload Optimization**
   - Compress images before upload
   - Use Cloudinary auto-optimization

### 🆘 Getting Help

1. **Check Existing Issues**
   - Search GitHub issues for similar problems
   - Read error messages carefully

2. **Create Support Issue**
   - Include error logs
   - Specify your OS and Node.js version
   - Provide steps to reproduce

3. **Community Support**
   - Create GitHub Discussion
   - Include environment details and error logs

### ✅ Health Check Checklist

Before reporting issues, verify:
- [ ] Node.js version 18+
- [ ] All dependencies installed (`npm run install:all`)
- [ ] Environment variables configured
- [ ] Ports 3001-3004 and 8000 are free
- [ ] Internet connection for MongoDB Atlas
- [ ] Google OAuth credentials valid
- [ ] Frontend running on port 5173

## 🎯 For Other Developers - Easy Setup Guide

### 🚀 "I Just Want It to Work" Guide

```bash
# 1. One command setup (recommended)
git clone https://github.com/Jeeva-VAM/chat-app.git
cd chat-app/Backend && npm install && npm run install:all && npm run dev

# 2. Open browser to http://localhost:8000/health
# 3. You should see: {"status": "OK", "services": [...]}
```

**That's it!** 🎉 Backend is running with:
- ✅ MongoDB Atlas (already configured)
- ✅ Cloudinary (already configured)  
- ✅ All 5 microservices running
- ⚠️ Only missing: Google OAuth (need your own credentials)

### 🔑 Add Your Google OAuth (2 minutes)

1. **Get Credentials:**
   - Go to [Google Console](https://console.cloud.google.com)
   - Create project → APIs & Services → Credentials
   - Create OAuth 2.0 Client → Web Application
   
2. **Configure URLs:**
   - Authorized origins: `http://localhost:5173`
   - Redirect URIs: `http://localhost:8000/api/auth/google/callback`
   
3. **Update .env:**
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

4. **Restart:** `npm run dev`

### 🌟 What You Get Out of the Box

- **5 Microservices**: Auth, User, Chat, Media, API Gateway
- **Real-time Chat**: WebSocket with encryption
- **File Uploads**: Profile images and chat media
- **MongoDB Atlas**: 3 databases pre-configured
- **Security**: JWT tokens, encryption, rate limiting
- **No Docker**: Simple Node.js processes
- **No Local Redis**: Uses Redis API (optional)

### 🔧 Customization Options

**Want to use your own database?**
```env
# Replace these in .env
MONGODB_URI_AUTH=mongodb://localhost:27017/chat-auth
MONGODB_URI_USER=mongodb://localhost:27017/chat-users  
MONGODB_URI_CHAT=mongodb://localhost:27017/chat-messages
```

**Want to use your own Cloudinary?**
```env
# Update these in .env
CLOUDINARY_API=your_api_key
CLOUDINARY_SECRET=your_secret
CLOUD_NAME=your_cloud_name
```

**Want to add Redis caching?**
```env
# Add to .env
REDIS_API_URL=https://your-redis-endpoint.upstash.io
REDIS_API_TOKEN=your_token_here
```

### 📱 Frontend Integration

Your frontend just needs to connect to:
```javascript
// API Base URL
const API_BASE = 'http://localhost:8000/api'

// WebSocket URL  
const WS_URL = 'ws://localhost:3003'

// Example: Login with Google
window.location.href = `${API_BASE}/auth/google`
```

### 🎮 API Testing

```bash
# Test authentication
curl http://localhost:8000/api/auth/google

# Test user endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/users/profile

# Test chat endpoints  
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/chat/messages

# Test media upload
curl -X POST -F "file=@image.jpg" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/media/upload
```

### 🚀 Production Deployment

**Heroku/Railway/Vercel:**
```bash
# Set environment variables on your platform
# Deploy with: git push heroku main
```

**VPS/DigitalOcean:**
```bash
# Install Node.js 18+
# Clone repo and run: npm run install:all
# Start with: pm2 start ecosystem.config.js
```

**Docker (optional):**
```bash
# Each service has a Dockerfile
docker-compose up --build
```

## 📚 Learning Resources

### Architecture Patterns
- **Microservices**: Each service handles one domain
- **API Gateway**: Single entry point for all requests
- **Event-Driven**: WebSocket for real-time features
- **Database per Service**: Separate MongoDB collections

### Technologies Used
- **Node.js + Express**: Backend framework
- **Socket.IO**: Real-time WebSocket communication
- **MongoDB**: Document database with Atlas hosting
- **JWT**: Stateless authentication tokens
- **Cloudinary**: Media storage and optimization
- **Google OAuth**: Social login integration

### Best Practices Implemented
- ✅ Environment-based configuration
- ✅ Error handling and logging
- ✅ Security headers and CORS
- ✅ Rate limiting
- ✅ Message encryption
- ✅ Input validation
- ✅ Graceful shutdown

## 📝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

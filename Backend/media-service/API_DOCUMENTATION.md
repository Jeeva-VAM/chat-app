# Chat App Backend API Documentation

## Overview
This document outlines all the APIs available in the chat app microservices backend, including endpoint URLs, HTTP methods, request/response formats, and data structures.

## Architecture
- **API Gateway**: Port 3000 (Main entry point)
- **Auth Service**: Port 3001
- **User Service**: Port 3002  
- **Chat Service**: Port 3003
- **Media Service**: Port 3004

## Base URL
All API requests should be made through the API Gateway:
```
http://localhost:3000/api
```

---

## 1. Authentication Service APIs

### 1.1 Google OAuth Login
**Endpoint:** `GET /auth/google`  
**Description:** Initiates Google OAuth flow  
**Request:** No body required  
**Response:** Redirects to Google OAuth consent page

### 1.2 Google OAuth Callback
**Endpoint:** `GET /auth/google/callback`  
**Description:** Handles OAuth callback from Google  
**Request:** Query parameters from Google  
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "https://cloudinary.com/image.jpg",
    "createdAt": "2026-02-25T10:00:00Z"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 1.3 Refresh Token
**Endpoint:** `POST /auth/refresh`  
**Description:** Refresh expired access token  
**Request:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```
**Response:**
```json
{
  "success": true,
  "accessToken": "new_jwt_access_token"
}
```

### 1.4 Logout
**Endpoint:** `POST /auth/logout`  
**Description:** Logout user and invalidate tokens  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:** No body required  
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 1.5 Verify Token
**Endpoint:** `GET /auth/verify`  
**Description:** Verify if access token is valid  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "john@example.com"
  }
}
```

---

## 2. User Service APIs

### 2.1 Get User Profile
**Endpoint:** `GET /users/profile`  
**Description:** Get current user's profile  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "https://cloudinary.com/image.jpg",
    "bio": "User bio",
    "isOnline": true,
    "lastSeen": "2026-02-25T10:00:00Z",
    "friends": ["friend_id_1", "friend_id_2"],
    "blockedUsers": ["blocked_user_id"],
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

### 2.2 Update User Profile
**Endpoint:** `PUT /users/profile`  
**Description:** Update current user's profile  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:**
```json
{
  "name": "Updated Name",
  "bio": "Updated bio",
  "profileImage": "https://cloudinary.com/new-image.jpg"
}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "Updated Name",
    "email": "john@example.com",
    "profileImage": "https://cloudinary.com/new-image.jpg",
    "bio": "Updated bio",
    "updatedAt": "2026-02-25T10:00:00Z"
  }
}
```

### 2.3 Search Users
**Endpoint:** `GET /users/search?q=search_term&limit=10&skip=0`  
**Description:** Search for users by name or email  
**Headers:** `Authorization: Bearer jwt_token`  
**Query Parameters:**
- `q` (string): Search term
- `limit` (number): Maximum results (default: 10)
- `skip` (number): Skip results for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "profileImage": "https://cloudinary.com/image.jpg",
      "bio": "User bio",
      "isOnline": false,
      "lastSeen": "2026-02-25T09:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### 2.4 Get User Suggestions
**Endpoint:** `GET /users/suggestions?limit=10`  
**Description:** Get suggested users (excludes current user, friends, and blocked users)  
**Headers:** `Authorization: Bearer jwt_token`  
**Query Parameters:**
- `limit` (number): Maximum results (default: 10)

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "suggested_user_id",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "profileImage": "https://cloudinary.com/alice.jpg",
      "bio": "Hello there!",
      "mutualFriendsCount": 3
    }
  ]
}
```

### 2.5 Get User by ID
**Endpoint:** `GET /users/:userId`  
**Description:** Get specific user's profile by ID  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "https://cloudinary.com/image.jpg",
    "bio": "User bio",
    "isOnline": true,
    "lastSeen": "2026-02-25T10:00:00Z"
  }
}
```

### 2.6 Add Friend
**Endpoint:** `POST /users/friends/:userId`  
**Description:** Add user to friends list  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "Friend added successfully"
}
```

### 2.7 Remove Friend
**Endpoint:** `DELETE /users/friends/:userId`  
**Description:** Remove user from friends list  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

### 2.8 Block User
**Endpoint:** `POST /users/block/:userId`  
**Description:** Block a user  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

### 2.9 Unblock User
**Endpoint:** `DELETE /users/block/:userId`  
**Description:** Unblock a user  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## 3. Chat Service APIs

### 3.1 Get User Chats
**Endpoint:** `GET /chats?limit=20&skip=0`  
**Description:** Get all chats for the current user  
**Headers:** `Authorization: Bearer jwt_token`  
**Query Parameters:**
- `limit` (number): Maximum results (default: 20)
- `skip` (number): Skip results for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_id",
      "type": "private",
      "participants": [
        {
          "id": "user_id",
          "name": "John Doe",
          "profileImage": "https://cloudinary.com/image.jpg"
        }
      ],
      "lastMessage": {
        "id": "message_id",
        "content": "Hello there!",
        "sender": "sender_id",
        "createdAt": "2026-02-25T10:00:00Z"
      },
      "unreadCount": 2,
      "updatedAt": "2026-02-25T10:00:00Z"
    }
  ],
  "hasMore": false
}
```

### 3.2 Get Chat Messages
**Endpoint:** `GET /chats/:chatId/messages?limit=50&skip=0`  
**Description:** Get messages for a specific chat  
**Headers:** `Authorization: Bearer jwt_token`  
**Query Parameters:**
- `limit` (number): Maximum results (default: 50)
- `skip` (number): Skip results for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message_id",
      "chatId": "chat_id",
      "content": "Hello there!",
      "sender": {
        "id": "sender_id",
        "name": "John Doe",
        "profileImage": "https://cloudinary.com/image.jpg"
      },
      "type": "text",
      "attachments": [],
      "readBy": [
        {
          "userId": "user_id",
          "readAt": "2026-02-25T10:00:00Z"
        }
      ],
      "createdAt": "2026-02-25T10:00:00Z",
      "updatedAt": "2026-02-25T10:00:00Z"
    }
  ],
  "hasMore": false
}
```

### 3.3 Send Message
**Endpoint:** `POST /chats/:chatId/messages`  
**Description:** Send a message to a chat  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:**
```json
{
  "content": "Hello there!",
  "type": "text",
  "attachments": []
}
```
**Response:**
```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "chatId": "chat_id",
    "content": "Hello there!",
    "sender": "sender_id",
    "type": "text",
    "attachments": [],
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

### 3.4 Create Private Chat
**Endpoint:** `POST /chats`  
**Description:** Create a new private chat  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:**
```json
{
  "participantId": "other_user_id",
  "type": "private"
}
```
**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "type": "private",
    "participants": ["current_user_id", "other_user_id"],
    "createdBy": "current_user_id",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

### 3.5 Create Group Chat
**Endpoint:** `POST /chats`  
**Description:** Create a new group chat  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:**
```json
{
  "name": "Group Chat Name",
  "description": "Group description",
  "participants": ["user_id_1", "user_id_2"],
  "type": "group"
}
```
**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "name": "Group Chat Name",
    "description": "Group description",
    "type": "group",
    "participants": ["current_user_id", "user_id_1", "user_id_2"],
    "createdBy": "current_user_id",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

### 3.6 Mark Messages as Read
**Endpoint:** `PUT /chats/:chatId/read`  
**Description:** Mark all messages in a chat as read  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### 3.7 Delete Message
**Endpoint:** `DELETE /chats/:chatId/messages/:messageId`  
**Description:** Delete a message (sender only)  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### 3.8 Edit Message
**Endpoint:** `PUT /chats/:chatId/messages/:messageId`  
**Description:** Edit a message (sender only)  
**Headers:** `Authorization: Bearer jwt_token`  
**Request:**
```json
{
  "content": "Updated message content"
}
```
**Response:**
```json
{
  "success": true,
  "message": {
    "id": "message_id",
    "content": "Updated message content",
    "edited": true,
    "editedAt": "2026-02-25T10:00:00Z"
  }
}
```

---

## 4. Media Service APIs

### 4.1 Upload Profile Image
**Endpoint:** `POST /media/upload/profile`  
**Description:** Upload profile image to Cloudinary  
**Headers:** `Authorization: Bearer jwt_token`  
**Content-Type:** `multipart/form-data`  
**Request:**
```
Form Data:
- file: (image file)
```
**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profiles/user_id.jpg",
  "publicId": "profiles/user_id",
  "format": "jpg",
  "width": 500,
  "height": 500
}
```

### 4.2 Upload Chat Media
**Endpoint:** `POST /media/upload/chat`  
**Description:** Upload media files for chat messages  
**Headers:** `Authorization: Bearer jwt_token`  
**Content-Type:** `multipart/form-data`  
**Request:**
```
Form Data:
- files: (multiple media files)
- chatId: "chat_id"
```
**Response:**
```json
{
  "success": true,
  "uploads": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/chat/file1.jpg",
      "publicId": "chat/file1",
      "format": "jpg",
      "resourceType": "image",
      "width": 1920,
      "height": 1080,
      "size": 524288
    }
  ]
}
```

### 4.3 Upload Multiple Files
**Endpoint:** `POST /media/upload/multiple`  
**Description:** Upload multiple files at once  
**Headers:** `Authorization: Bearer jwt_token`  
**Content-Type:** `multipart/form-data`  
**Request:**
```
Form Data:
- files: (multiple files)
```
**Response:**
```json
{
  "success": true,
  "uploads": [
    {
      "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/files/document.pdf",
      "publicId": "files/document",
      "format": "pdf",
      "resourceType": "raw",
      "size": 1048576
    }
  ]
}
```

### 4.4 Delete Media
**Endpoint:** `DELETE /media/:publicId`  
**Description:** Delete media from Cloudinary  
**Headers:** `Authorization: Bearer jwt_token`  
**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

---

## 5. WebSocket Events (Socket.IO)

### Connection
**Event:** `connection`  
**Description:** User connects to chat  
**Server Response:** Welcome message and user online status update

### 5.1 Join Chat
**Event:** `join_chat`  
**Client Payload:**
```json
{
  "chatId": "chat_id",
  "userId": "user_id"
}
```
**Server Response:** User joins chat room

### 5.2 Send Message
**Event:** `send_message`  
**Client Payload:**
```json
{
  "chatId": "chat_id",
  "content": "Hello there!",
  "type": "text",
  "attachments": []
}
```
**Server Broadcast:**
```json
{
  "messageId": "message_id",
  "chatId": "chat_id",
  "content": "Hello there!",
  "sender": {
    "id": "sender_id",
    "name": "John Doe",
    "profileImage": "https://cloudinary.com/image.jpg"
  },
  "type": "text",
  "attachments": [],
  "createdAt": "2026-02-25T10:00:00Z"
}
```

### 5.3 Typing Indicator
**Event:** `typing_start`  
**Client Payload:**
```json
{
  "chatId": "chat_id",
  "userId": "user_id"
}
```
**Event:** `typing_stop`  
**Client Payload:**
```json
{
  "chatId": "chat_id",
  "userId": "user_id"
}
```

### 5.4 Message Read
**Event:** `message_read`  
**Client Payload:**
```json
{
  "chatId": "chat_id",
  "messageId": "message_id"
}
```

### 5.5 User Status
**Event:** `user_online`  
**Server Broadcast:**
```json
{
  "userId": "user_id",
  "isOnline": true,
  "lastSeen": "2026-02-25T10:00:00Z"
}
```

**Event:** `user_offline`  
**Server Broadcast:**
```json
{
  "userId": "user_id",
  "isOnline": false,
  "lastSeen": "2026-02-25T10:00:00Z"
}
```

---

## 6. Error Responses

All APIs return consistent error responses:

### 6.1 Authentication Error (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 6.2 Validation Error (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 6.3 Not Found Error (404)
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 6.4 Server Error (500)
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

### 6.5 Rate Limit Error (429)
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later.",
  "retryAfter": 60
}
```

---

## 7. Data Models

### 7.1 User Model
```json
{
  "id": "string",
  "googleId": "string",
  "name": "string",
  "email": "string",
  "profileImage": "string",
  "bio": "string",
  "isOnline": "boolean",
  "lastSeen": "Date",
  "friends": ["string"],
  "blockedUsers": ["string"],
  "refreshTokens": ["string"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.2 Chat Model
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "type": "private|group",
  "participants": ["string"],
  "createdBy": "string",
  "lastMessage": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.3 Message Model
```json
{
  "id": "string",
  "chatId": "string",
  "sender": "string",
  "content": "string",
  "encryptedContent": "string",
  "type": "text|image|file|audio|video",
  "attachments": [
    {
      "url": "string",
      "type": "string",
      "size": "number",
      "name": "string"
    }
  ],
  "readBy": [
    {
      "userId": "string",
      "readAt": "Date"
    }
  ],
  "edited": "boolean",
  "editedAt": "Date",
  "deleted": "boolean",
  "deletedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 8. Security Features

### 8.1 Authentication
- JWT tokens with access/refresh token pattern
- Google OAuth 2.0 integration
- Token validation middleware

### 8.2 Encryption
- End-to-end message encryption using AES-256-CBC
- Messages are encrypted before storing in database
- Decryption happens on message retrieval

### 8.3 Rate Limiting
- 100 requests per 15 minutes per IP
- Different limits for different endpoints
- Headers include rate limit information

### 8.4 CORS
- Configured for frontend domains
- Credentials included in CORS policy
- Preflight requests handled

### 8.5 Security Headers
- Helmet.js for security headers
- XSS protection
- Content Security Policy
- HSTS headers

---

## 9. Environment Variables

### Required Environment Variables
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKER=localhost:9092

# Encryption
ENCRYPTION_KEY=32-character-encryption-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 10. Getting Started

### 10.1 Installation
```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start all services
npm run dev
```

### 10.2 Service URLs
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- User Service: http://localhost:3002
- Chat Service: http://localhost:3003
- Media Service: http://localhost:3004

### 10.3 Health Check
```
GET http://localhost:3000/api/health
```

This will return the health status of all services.

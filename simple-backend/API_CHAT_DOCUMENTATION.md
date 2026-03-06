# Chat App API Documentation

## Overview
This API provides endpoints for managing user profiles, conversations, and messages in the chat application.

## Base URL
```
http://localhost:3001/api
```

## Profile Endpoints

### Get User Profile
```http
GET /api/profile/:userId
```
Get profile details for a specific user.

### Create/Update Profile
```http
POST /api/profile
```
Create or update a user profile.
**Body:**
```json
{
  "userId": "string",
  "name": "string",
  "email": "string",
  "profileImage": "string (optional)",
  "bio": "string (optional)"
}
```

### Update Profile Fields
```http
PATCH /api/profile/:userId
```
Partially update a user profile.

### Get All Profiles
```http
GET /api/profiles
```
Get paginated list of all profiles.
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search in name/email
- `exclude` (optional): Exclude specific userId

### Delete Profile
```http
DELETE /api/profile/:userId
```
Delete a user profile.

## Chat Endpoints

### Get User's Conversations
```http
GET /api/chat/conversations?userId={userId}
```
Get all conversations for a specific user.

### Create Direct Conversation
```http
POST /api/chat/conversations/direct
```
Create or get existing direct conversation between two users.
**Body:**
```json
{
  "user1Id": "string",
  "user2Id": "string"
}
```

### Get Messages in Conversation
```http
GET /api/chat/conversations/:conversationId/messages
```
Get messages in a specific conversation.
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

### Send Message
```http
POST /api/chat/conversations/:conversationId/messages
```
Send a message in a conversation.
**Body:**
```json
{
  "senderId": "string",
  "messageType": "text|image|file|audio|video",
  "content": {
    "text": "string (required for text messages)",
    "mediaUrl": "string (required for media messages)",
    "fileName": "string (optional)",
    "fileSize": "number (optional)"
  },
  "replyTo": {
    "messageId": "string (optional)",
    "senderId": "string (optional)",
    "text": "string (optional)"
  },
  "mentions": [
    {
      "userId": "string",
      "name": "string",
      "startIndex": "number",
      "length": "number"
    }
  ]
}
```

### Mark Messages as Read
```http
PATCH /api/chat/conversations/:conversationId/read
```
Mark all messages in a conversation as read for a user.
**Body:**
```json
{
  "userId": "string"
}
```

### Search Messages
```http
GET /api/chat/messages/search
```
Search messages across conversations.
**Query Parameters:**
- `q`: Search query (required)
- `userId`: User ID (required)
- `conversationId`: Specific conversation (optional)

### Get Unread Count
```http
GET /api/chat/unread-count?userId={userId}
```
Get total unread message count for a user.

### Delete Message
```http
DELETE /api/chat/messages/:messageId
```
Soft delete a message (only sender can delete).
**Body:**
```json
{
  "userId": "string"
}
```

### Edit Message
```http
PATCH /api/chat/messages/:messageId
```
Edit a message (only sender can edit).
**Body:**
```json
{
  "userId": "string",
  "text": "string"
}
```

### Add Reaction
```http
POST /api/chat/messages/:messageId/reactions
```
Add emoji reaction to a message.
**Body:**
```json
{
  "userId": "string",
  "emoji": "string"
}
```

### Remove Reaction
```http
DELETE /api/chat/messages/:messageId/reactions
```
Remove emoji reaction from a message.
**Body:**
```json
{
  "userId": "string",
  "emoji": "string (optional - removes all reactions if not provided)"
}
```

## Data Models

### User Schema
```javascript
{
  userId: String (required, unique),
  name: String (required),
  email: String (required, unique),
  profileImage: String,
  bio: String (max 500 chars),
  isOnline: Boolean,
  lastSeen: Date,
  socketId: String,
  blockedUsers: [String],
  preferences: {
    notifications: Boolean,
    soundNotifications: Boolean,
    messagePreview: Boolean
  }
}
```

### Conversation Schema
```javascript
{
  participants: [{
    userId: String (required),
    joinedAt: Date,
    leftAt: Date,
    role: 'member'|'admin'
  }],
  type: 'direct'|'group',
  name: String (required for groups),
  description: String,
  avatar: String,
  lastMessage: {
    messageId: ObjectId,
    text: String,
    senderId: String,
    timestamp: Date,
    messageType: String
  },
  unreadCount: [{
    userId: String,
    count: Number
  }],
  settings: {
    allowAddMembers: Boolean,
    allowEditInfo: Boolean,
    messageRetention: Number (days)
  }
}
```

### Message Schema
```javascript
{
  conversationId: ObjectId (required),
  senderId: String (required),
  messageType: 'text'|'image'|'file'|'audio'|'video'|'system',
  content: {
    text: String,
    mediaUrl: String,
    fileName: String,
    fileSize: Number,
    duration: Number,
    thumbnailUrl: String
  },
  replyTo: {
    messageId: ObjectId,
    senderId: String,
    text: String,
    messageType: String
  },
  reactions: [{
    userId: String,
    emoji: String,
    createdAt: Date
  }],
  mentions: [{
    userId: String,
    name: String,
    startIndex: Number,
    length: Number
  }],
  readBy: [{
    userId: String,
    readAt: Date
  }],
  deliveredTo: [{
    userId: String,
    deliveredAt: Date
  }],
  isDeleted: Boolean,
  isEdited: Boolean,
  editHistory: [{
    originalText: String,
    editedAt: Date,
    editedBy: String
  }]
}
```

## Socket.io Events

The server also supports real-time communication via Socket.io on the same port (3001).

### Connection
```javascript
// Client connection
const socket = io('http://localhost:3001');

// Server events
socket.on('hello', (message) => {
  console.log(message); // "Hi user"
});
```

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## CORS

The API accepts requests from `http://localhost:5173` (frontend development server) with credentials support enabled.

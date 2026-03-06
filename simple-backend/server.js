const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 3001;
 
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let db;
let profiles;
let messages;
let conversations;
 
console.log(MONGODB_URI)
// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
 
// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('chat-app');
    profiles = db.collection('profiles');
    messages = db.collection('messages');
    conversations = db.collection('conversations');
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}
 
// Routes
 
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Profile server running' });
});
 
// Get user profile by OAuth user ID
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
   
    const profile = await profiles.findOne({ userId: userId });
   
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
   
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});
 
// Create or update user profile
app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
   
    // Validate required fields
    if (!profileData.userId || !profileData.name || !profileData.email) {
      return res.status(400).json({ error: 'Missing required fields: userId, name, email' });
    }
   
    // Add timestamps
    const now = new Date();
    profileData.updatedAt = now;
   
    // Upsert profile (update if exists, create if not)
    const result = await profiles.findOneAndUpdate(
      { userId: profileData.userId },
      {
        $set: profileData,
        $setOnInsert: { createdAt: now }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
   
    res.json({
      success: true,
      message: 'Profile saved successfully',
      profile: result.value || result
    });
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});
 
// Update specific profile fields
app.patch('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
   
    // Remove userId from update data to prevent changing it
    delete updateData.userId;
   
    // Add updated timestamp
    updateData.updatedAt = new Date();
   
    const result = await profiles.findOneAndUpdate(
      { userId: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
   
    if (!result.value) {
      return res.status(404).json({ error: 'Profile not found' });
    }
   
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: result.value
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
 
app.get('/api/profiles', async (req, res) => {
  try {
    const { page = 1, limit = 100, search, exclude } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Exclude current user
    if (exclude) {
      query.userId = { $ne: exclude };
    }

    if (search) {
      const searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };

      if (query.userId) {
        query = { $and: [{ userId: query.userId }, searchQuery] };
      } else {
        query = searchQuery;
      }
    }

    const profilesList = await profiles
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.json({ profiles: profilesList });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
});
 
// Delete profile
app.delete('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
   
    const result = await profiles.deleteOne({ userId: userId });
   
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
   
    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});
 
// Clean up seed data (profiles without userId or with example emails)
app.delete('/api/profiles/cleanup', async (req, res) => {
  try {
    // Delete profiles that don't have userId (seed data) or have example.com emails or test users
    const result = await profiles.deleteMany({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { email: { $regex: '@example\\.com$' } },
        { email: { $regex: 'testuser.*@gmail\\.com$' } }, // Remove test users
        { userId: { $regex: '^test_user_' } } // Remove test user IDs
      ]
    });
   
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} seed profiles`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup profiles error:', error);
    res.status(500).json({ error: 'Failed to cleanup profiles' });
  }
});
 
// Clean up conversations and messages with non-existent users
app.delete('/api/conversations/cleanup', async (req, res) => {
  try {
    // Get all valid user IDs from profiles
    const validUsers = await profiles.find({}, { projection: { userId: 1 } }).toArray();
    const validUserIds = new Set(validUsers.map(user => user.userId));
   
    // Find conversations with participants that don't exist in profiles
    const orphanedConversations = await conversations.find({}).toArray();
    let deletedConversations = 0;
    let deletedMessages = 0;
   
    for (const conv of orphanedConversations) {
      const hasOrphanedParticipant = conv.participants.some(participantId =>
        !validUserIds.has(participantId) && participantId.startsWith('test_user_')
      );
     
      if (hasOrphanedParticipant) {
        // Delete associated messages first
        const messagesResult = await messages.deleteMany({ conversationId: conv._id });
        deletedMessages += messagesResult.deletedCount;
       
        // Delete the conversation
        await conversations.deleteOne({ _id: conv._id });
        deletedConversations++;
      }
    }
   
    res.json({
      success: true,
      message: `Cleaned up ${deletedConversations} orphaned conversations and ${deletedMessages} messages`,
      deletedConversations,
      deletedMessages
    });
  } catch (error) {
    console.error('Cleanup conversations error:', error);
    res.status(500).json({ error: 'Failed to cleanup conversations' });
  }
});
 
// Create realistic demo users (OAuth-like structure)
// app.post('/api/profiles/create-demo', async (req, res) => {
//   try {
//     const demoUsers = [
//       {
//         userId: '108123456789012345678',  // OAuth-like ID
//         name: 'Aadhi Raghavan',
//         email: 'aadhi.raghavan@gmail.com',
//         profileImage: 'https://lh3.googleusercontent.com/a/default-user-1',
//         bio: '',
//         status: 'online',
//         lastSeen: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         userId: '109987654321098765432',  // OAuth-like ID  
//         name: 'Maari Priya A L',
//         email: 'maaripriya.al@gmail.com',
//         profileImage: 'https://lh3.googleusercontent.com/a/default-user-2',
//         bio: '',
//         status: 'offline',
//         lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];
 
//     // Insert users with proper OAuth-like structure
//     const result = await profiles.insertMany(demoUsers);
   
//     res.json({
//       success: true,
//       message: `Created ${result.insertedCount} demo users`,
//       users: result.insertedCount
//     });
//   } catch (error) {
//     console.error('Create demo users error:', error);
//     res.status(500).json({ error: 'Failed to create demo users' });
//   }
// });
//         profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
//         bio: 'Test user for demo',
//         status: 'online',
//         lastSeen: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         userId: 'test_user_2',
//         name: 'Test User 2',
//         email: 'testuser2@gmail.com',
//         profileImage: 'https://randomuser.me/api/portraits/women/2.jpg',
//         bio: 'Another test user',
//         status: 'offline',
//         lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];
 
//     // Insert test users
//     const result = await profiles.insertMany(testUsers);
   
//     res.json({
//       success: true,
//       message: `Created ${result.insertedCount} test users`,
//       users: result.insertedCount
//     });
//   } catch (error) {
//     console.error('Create test users error:', error);
//     res.status(500).json({ error: 'Failed to create test users' });
//   }
// });
 
// Fix existing profiles missing userId (temporary endpoint for your profile)
app.patch('/api/profiles/fix-userid', async (req, res) => {
  try {
    const { email, userId } = req.body;
   
    if (!email || !userId) {
      return res.status(400).json({ error: 'Email and userId required' });
    }
   
    const result = await profiles.updateOne(
      { email: email },
      { $set: { userId: userId, updatedAt: new Date() } }
    );
   
    res.json({
      success: true,
      message: 'Profile updated with userId',
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix userId error:', error);
    res.status(500).json({ error: 'Failed to fix userId' });
  }
});
 
// MESSAGE ENDPOINTS
 
// Get all conversations for a user
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
   
    // Get all conversations where user is a participant
    const userConversations = await conversations.find({
      participants: userId
    }).sort({ lastMessageAt: -1 }).toArray();
   
    // Get participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        // Get the other participant (not the current user)
        const otherParticipant = conv.participants.find(p => p !== userId);
        const participantProfile = await profiles.findOne({ userId: otherParticipant });
       
        return {
          conversationId: conv._id,
          participant: {
            userId: otherParticipant,
            name: participantProfile?.name || 'Unknown User',
            profileImage: participantProfile?.profileImage,
            status: participantProfile?.status || 'offline'
          },
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount?.[userId] || 0
        };
      })
    );
   
    res.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});
 
// Get messages for a conversation
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
   
    const conversationMessages = await messages
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
   
    // Reverse to show oldest first
    conversationMessages.reverse();
   
    const total = await messages.countDocuments({ conversationId });
   
    res.json({
      messages: conversationMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});
 
// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, recipientId, text, type = 'text' } = req.body;
   
    if (!senderId || !recipientId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
   
    // Create conversation ID (consistent between users)
    const conversationId = [senderId, recipientId].sort().join('_');
   
    // Create message
    const message = {
      conversationId,
      senderId,
      recipientId,
      text,
      type,
      createdAt: new Date(),
      status: 'sent',
      readBy: []
    };
   
    const result = await messages.insertOne(message);
   
    // Update or create conversation
    await conversations.findOneAndUpdate(
      { _id: conversationId },
      {
        $set: {
          participants: [senderId, recipientId],
          lastMessage: {
            text,
            senderId,
            createdAt: new Date()
          },
          lastMessageAt: new Date()
        },
        $inc: {
          [`unreadCount.${recipientId}`]: 1
        }
      },
      { upsert: true }
    );
   
    res.json({
      success: true,
      message: { ...message, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
 
// Mark messages as read
app.patch('/api/messages/read/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
   
    // Mark all messages as read for this user
    await messages.updateMany(
      {
        conversationId,
        readBy: { $ne: userId }
      },
      {
        $push: { readBy: userId },
        $set: { status: 'read' }
      }
    );
   
    // Reset unread count for this user
    await conversations.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCount.${userId}`]: 0 } }
    );
   
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});
 
// Search messages
app.get('/api/messages/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;
   
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
   
    const searchResults = await messages.find({
      $and: [
        { $or: [{ senderId: userId }, { recipientId: userId }] },
        { text: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 }).limit(50).toArray();
   
    res.json({ messages: searchResults });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});
 
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
 
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
 
// Start server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Profile server running on port ${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /api/profile/:userId - Get user profile`);
    console.log(`   POST /api/profile - Create/update profile`);
    console.log(`   PATCH /api/profile/:userId - Update profile fields`);
    console.log(`   GET /api/profiles - Get all profiles`);
    console.log(`   DELETE /api/profile/:userId - Delete profile`);
    console.log(`   GET /api/conversations/:userId - Get user conversations`);
    console.log(`   GET /api/messages/:conversationId - Get conversation messages`);
    console.log(`   POST /api/messages - Send message`);
    console.log(`   PATCH /api/messages/read/:conversationId - Mark messages as read`);
    console.log(`   GET /api/messages/search/:userId - Search messages`);
  });
}
 
startServer().catch(console.error);
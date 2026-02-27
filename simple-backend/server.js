const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://razakdev07_db_user:drvve6iPq8sKjUls@cluster0.yymd2cc.mongodb.net/chat-users?retryWrites=true&w=majority&appName=Cluster0';
let db;
let profiles;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('chat-users');
    profiles = db.collection('profiles');
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

// Get all profiles (for suggestions)
app.get('/api/profiles', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Add search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const profilesList = await profiles
      .find(query, { 
        projection: { 
          name: 1, 
          email: 1, 
          profileImage: 1, 
          bio: 1, 
          status: 1, 
          lastSeen: 1 
        }
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 })
      .toArray();
    
    const total = await profiles.countDocuments(query);
    
    res.json({
      profiles: profilesList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
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
  });
}

startServer().catch(console.error);
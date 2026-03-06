const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173'
  }
});

io.on("connection",(socket)=>{
   console.log("user connected");
   socket.emit("hello","Hi user");
});
const PORT = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://razakdev07_db_user:drvve6iPq8sKjUls@cluster0.yymd2cc.mongodb.net/chat-users?retryWrites=true&w=majority&appName=Cluster0';
let db;
let profiles;
console.log(MONGODB_URI)

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Chat routes
app.use('/api/chat', chatRoutes);


async function connectDB() {
  try {
    // Connect with MongoClient for existing profile operations
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('chat-users');
    profiles = db.collection('profiles');
    console.log('✅ Connected to MongoDB Atlas with MongoClient');
    
    // Also connect with Mongoose for new chat schemas
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas with Mongoose');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}


app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Profile server running' });
});


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


app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
   
    if (!profileData.userId || !profileData.name || !profileData.email) {
      return res.status(400).json({ error: 'Missing required fields: userId, name, email' });
    }
    
    
    const now = new Date();
    profileData.updatedAt = now;
    
    
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


app.patch('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    
    delete updateData.userId;
    
    
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
    const { page = 1, limit = 20, search, exclude } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    
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


app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


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
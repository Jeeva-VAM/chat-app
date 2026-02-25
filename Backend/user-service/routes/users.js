const express = require('express');
const { body, query, validationResult } = require('express-validator');
const UserProfile = require('../models/UserProfile');
const { authMiddleware } = require('../../shared/auth');
const { setCache, getCache, deleteCache } = require('../../shared/redis');
const axios = require('axios');

const router = express.Router();

// Auth middleware for all routes
router.use(authMiddleware);

// Sync user profile from auth service
router.post('/sync', async (req, res) => {
  try {
    const { userId, email, name, profileImage } = req.user;

    let userProfile = await UserProfile.findOne({ userId: req.user.userId });

    if (!userProfile) {
      // Create new profile
      userProfile = new UserProfile({
        userId: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        profileImage: profileImage || ''
      });
    } else {
      // Update existing profile
      userProfile.email = req.user.email;
      userProfile.name = req.user.name;
      if (profileImage) {
        userProfile.profileImage = profileImage;
      }
    }

    await userProfile.save();

    // Cache the profile
    await setCache(`profile:${userProfile.userId}`, userProfile, 3600);

    res.json({ 
      message: 'Profile synced successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Sync profile error:', error);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
});

// Get suggested users (all users except current user and blocked users)
router.get('/suggestions', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().trim().isLength({ min: 1 }).withMessage('Search query cannot be empty')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const skip = (page - 1) * limit;

      // Get current user's profile to check blocked users
      const currentUserProfile = await UserProfile.findOne({ userId: req.user.userId });
      const blockedUserIds = currentUserProfile?.blockedUsers?.map(blocked => blocked.userId) || [];

      // Build query
      let query = {
        userId: { $ne: req.user.userId }, // Exclude current user
        isActive: true
      };

      // Exclude blocked users
      if (blockedUserIds.length > 0) {
        query.userId = { 
          $ne: req.user.userId,
          $nin: blockedUserIds 
        };
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Get users with pagination
      const users = await UserProfile.find(query)
        .select('userId name email profileImage status lastSeen bio')
        .sort({ lastSeen: -1, name: 1 })
        .skip(skip)
        .limit(limit);

      const totalUsers = await UserProfile.countDocuments(query);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({ error: 'Failed to get user suggestions' });
    }
  }
);

// Get user profile
router.get('/profile/:userId?', async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.userId;

    // Check cache first
    let profile = await getCache(`profile:${targetUserId}`);

    if (!profile) {
      profile = await UserProfile.findOne({ userId: targetUserId });
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Cache the profile
      await setCache(`profile:${targetUserId}`, profile, 3600);
    }

    // If requesting another user's profile, check privacy settings
    if (targetUserId !== req.user.userId) {
      // Check if user is blocked
      const currentUserProfile = await UserProfile.findOne({ userId: req.user.userId });
      const isBlocked = currentUserProfile?.blockedUsers?.some(
        blocked => blocked.userId.toString() === targetUserId
      ) || false;

      if (isBlocked) {
        return res.status(403).json({ error: 'User not accessible' });
      }

      // Filter sensitive information based on privacy settings
      const publicProfile = {
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        profileImage: profile.preferences?.privacy?.showProfileImage ? profile.profileImage : '',
        bio: profile.bio,
        status: profile.status,
        lastSeen: profile.preferences?.privacy?.showLastSeen ? profile.lastSeen : null
      };

      return res.json({ profile: publicProfile });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.patch('/profile',
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
    body('preferences.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme'),
    body('preferences.notifications.sound').optional().isBoolean(),
    body('preferences.notifications.desktop').optional().isBoolean(),
    body('preferences.notifications.email').optional().isBoolean(),
    body('preferences.privacy.showLastSeen').optional().isBoolean(),
    body('preferences.privacy.showProfileImage').optional().isBoolean(),
    body('preferences.privacy.allowMessagesFromStrangers').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = req.body;
      
      // Find and update profile
      const profile = await UserProfile.findOneAndUpdate(
        { userId: req.user.userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Update cache
      await setCache(`profile:${profile.userId}`, profile, 3600);

      // If name or profile image changed, update auth service
      if (updateData.name || updateData.profileImage !== undefined) {
        try {
          await axios.patch(`${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/profile`, {
            name: updateData.name,
            profileImage: updateData.profileImage
          }, {
            headers: {
              'Authorization': req.headers.authorization
            }
          });
        } catch (authError) {
          console.warn('Failed to update auth service:', authError.message);
        }
      }

      res.json({ 
        message: 'Profile updated successfully',
        profile 
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Update user status
router.patch('/status',
  [
    body('status').isIn(['online', 'offline', 'away', 'busy']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;

      const profile = await UserProfile.findOne({ userId: req.user.userId });
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      await profile.updateStatus(status);

      // Update cache
      await setCache(`profile:${profile.userId}`, profile, 3600);

      res.json({ 
        message: 'Status updated successfully',
        status: profile.status,
        lastSeen: profile.lastSeen
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

// Block user
router.post('/block/:userId',
  async (req, res) => {
    try {
      const { userId: userIdToBlock } = req.params;

      if (userIdToBlock === req.user.userId) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }

      // Check if user exists
      const targetUser = await UserProfile.findOne({ userId: userIdToBlock });
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentProfile = await UserProfile.findOne({ userId: req.user.userId });
      if (!currentProfile) {
        return res.status(404).json({ error: 'Your profile not found' });
      }

      await currentProfile.blockUser(userIdToBlock);

      // Clear relevant caches
      await deleteCache(`profile:${currentProfile.userId}`);

      res.json({ message: 'User blocked successfully' });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ error: 'Failed to block user' });
    }
  }
);

// Unblock user
router.delete('/block/:userId',
  async (req, res) => {
    try {
      const { userId: userIdToUnblock } = req.params;

      const currentProfile = await UserProfile.findOne({ userId: req.user.userId });
      if (!currentProfile) {
        return res.status(404).json({ error: 'Your profile not found' });
      }

      await currentProfile.unblockUser(userIdToUnblock);

      // Clear relevant caches
      await deleteCache(`profile:${currentProfile.userId}`);

      res.json({ message: 'User unblocked successfully' });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ error: 'Failed to unblock user' });
    }
  }
);

// Get blocked users
router.get('/blocked', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.userId })
      .populate('blockedUsers.userId', 'name email profileImage')
      .select('blockedUsers');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ blockedUsers: profile.blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// Search users
router.get('/search',
  [
    query('q').notEmpty().trim().isLength({ min: 1 }).withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q: searchQuery } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Get current user's blocked users
      const currentUserProfile = await UserProfile.findOne({ userId: req.user.userId });
      const blockedUserIds = currentUserProfile?.blockedUsers?.map(blocked => blocked.userId) || [];

      const query = {
        userId: { $ne: req.user.userId },
        isActive: true,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      // Exclude blocked users
      if (blockedUserIds.length > 0) {
        query.userId = { 
          $ne: req.user.userId,
          $nin: blockedUserIds 
        };
      }

      const users = await UserProfile.find(query)
        .select('userId name email profileImage status lastSeen bio')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await UserProfile.countDocuments(query);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
);

module.exports = router;

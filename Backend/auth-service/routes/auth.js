const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, verifyToken, authMiddleware } = require('../../shared/auth');
const { setCache, getCache, deleteCache } = require('../../shared/redis');

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = generateToken({ 
        userId: user._id, 
        email: user.email,
        name: user.name 
      });

      const refreshToken = generateToken({ 
        userId: user._id, 
        type: 'refresh' 
      }, '7d');

      // Save refresh token
      await user.addRefreshToken(refreshToken);

      // Cache user data
      await setCache(`user:${user._id}`, {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        isActive: user.isActive
      }, 3600);

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-success?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-error`);
    }
  }
);

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Try to get from cache first
    let user = await getCache(`user:${req.user.userId}`);
    
    if (!user) {
      user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Cache user data
      await setCache(`user:${user._id}`, {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        isActive: user.isActive
      }, 3600);
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Refresh token
router.post('/refresh', 
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { refreshToken } = req.body;
      
      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Check if refresh token exists in database
      const user = await User.findOne({
        _id: decoded.userId,
        'refreshTokens.token': refreshToken
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new access token
      const newAccessToken = generateToken({
        userId: user._id,
        email: user.email,
        name: user.name
      });

      res.json({ 
        accessToken: newAccessToken,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
);

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const user = await User.findById(req.user.userId);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear cache
    await deleteCache(`user:${req.user.userId}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Logout from all devices
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    // Clear cache
    await deleteCache(`user:${req.user.userId}`);

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

// Update user profile
router.patch('/profile', 
  authMiddleware,
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, profileImage } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (name) user.name = name;
      if (profileImage !== undefined) user.profileImage = profileImage;

      await user.save();

      // Update cache
      await setCache(`user:${user._id}`, {
        _id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        isActive: user.isActive
      }, 3600);

      res.json({ 
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Validate token endpoint
router.post('/validate', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ valid: false, error: 'Invalid user' });
    }

    res.json({ 
      valid: true, 
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

module.exports = router;

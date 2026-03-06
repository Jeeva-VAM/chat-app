const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  blockedUsers: [{
    type: String, // User IDs
    ref: 'User'
  }],
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundNotifications: {
      type: Boolean,
      default: true
    },
    messagePreview: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for full name or display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email;
});

// Method to check if user is blocked
userSchema.methods.isBlocked = function(userId) {
  return this.blockedUsers.includes(userId);
};

// Method to block a user
userSchema.methods.blockUser = function(userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
  }
};

// Method to unblock a user
userSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => id !== userId);
};

// Static method to find online users
userSchema.statics.findOnlineUsers = function() {
  return this.find({ isOnline: true });
};

module.exports = mongoose.model('User', userSchema);

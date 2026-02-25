const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      sound: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    },
    privacy: {
      showLastSeen: { type: Boolean, default: true },
      showProfileImage: { type: Boolean, default: true },
      allowMessagesFromStrangers: { type: Boolean, default: true }
    }
  },
  blockedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  friends: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.blockedUsers;
      return ret;
    }
  }
});

// Indexes for better performance
userProfileSchema.index({ status: 1 });
userProfileSchema.index({ lastSeen: -1 });
userProfileSchema.index({ 'friends.userId': 1 });
userProfileSchema.index({ isActive: 1 });
userProfileSchema.index({ name: 'text', email: 'text' });

// Methods
userProfileSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'offline') {
    this.lastSeen = new Date();
  }
  return this.save();
};

userProfileSchema.methods.blockUser = function(userIdToBlock) {
  const existingBlock = this.blockedUsers.find(
    blocked => blocked.userId.toString() === userIdToBlock.toString()
  );
  
  if (!existingBlock) {
    this.blockedUsers.push({ userId: userIdToBlock });
  }
  
  return this.save();
};

userProfileSchema.methods.unblockUser = function(userIdToUnblock) {
  this.blockedUsers = this.blockedUsers.filter(
    blocked => blocked.userId.toString() !== userIdToUnblock.toString()
  );
  
  return this.save();
};

userProfileSchema.methods.addFriend = function(friendUserId) {
  const existingFriend = this.friends.find(
    friend => friend.userId.toString() === friendUserId.toString()
  );
  
  if (!existingFriend) {
    this.friends.push({ userId: friendUserId, status: 'pending' });
  }
  
  return this.save();
};

userProfileSchema.methods.acceptFriendRequest = function(friendUserId) {
  const friend = this.friends.find(
    friend => friend.userId.toString() === friendUserId.toString()
  );
  
  if (friend) {
    friend.status = 'accepted';
  }
  
  return this.save();
};

userProfileSchema.methods.removeFriend = function(friendUserId) {
  this.friends = this.friends.filter(
    friend => friend.userId.toString() !== friendUserId.toString()
  );
  
  return this.save();
};

module.exports = mongoose.model('UserProfile', userProfileSchema);

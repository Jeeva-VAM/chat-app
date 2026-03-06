const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    }
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    // Required for group conversations, optional for direct
    required: function() {
      return this.type === 'group';
    }
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    text: String,
    senderId: String,
    timestamp: Date,
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video'],
      default: 'text'
    }
  },
  unreadCount: [{
    userId: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  isArchived: [{
    userId: String,
    archivedAt: Date
  }],
  isPinned: [{
    userId: String,
    pinnedAt: Date
  }],
  isMuted: [{
    userId: String,
    mutedAt: Date,
    muteUntil: Date // null for permanent mute
  }],
  settings: {
    allowAddMembers: {
      type: Boolean,
      default: true
    },
    allowEditInfo: {
      type: Boolean,
      default: true
    },
    messageRetention: {
      type: Number, // days
      default: null // null means forever
    }
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ 'participants.userId': 1, updatedAt: -1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual to get active participants (not left)
conversationSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId === userId && !p.leftAt);
};

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.userId === userId);
  
  if (existingParticipant) {
    // If user was previously in conversation but left, rejoin them
    if (existingParticipant.leftAt) {
      existingParticipant.leftAt = null;
      existingParticipant.joinedAt = new Date();
      existingParticipant.role = role;
    }
  } else {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
  }
  
  // Initialize unread count for new participant
  if (!this.unreadCount.find(u => u.userId === userId)) {
    this.unreadCount.push({ userId, count: 0 });
  }
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.leftAt = new Date();
  }
};

// Method to get unread count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  const userUnread = this.unreadCount.find(u => u.userId === userId);
  return userUnread ? userUnread.count : 0;
};

// Method to increment unread count for all participants except sender
conversationSchema.methods.incrementUnreadCount = function(senderId) {
  this.participants.forEach(participant => {
    if (participant.userId !== senderId && !participant.leftAt) {
      const userUnread = this.unreadCount.find(u => u.userId === participant.userId);
      if (userUnread) {
        userUnread.count += 1;
      } else {
        this.unreadCount.push({ userId: participant.userId, count: 1 });
      }
    }
  });
};

// Method to mark as read for user
conversationSchema.methods.markAsRead = function(userId) {
  const userUnread = this.unreadCount.find(u => u.userId === userId);
  if (userUnread) {
    userUnread.count = 0;
  }
};

// Method to check if conversation is muted for user
conversationSchema.methods.isMutedForUser = function(userId) {
  const muteEntry = this.isMuted.find(m => m.userId === userId);
  if (!muteEntry) return false;
  
  // Check if mute has expired
  if (muteEntry.muteUntil && muteEntry.muteUntil < new Date()) {
    // Remove expired mute
    this.isMuted = this.isMuted.filter(m => m.userId !== userId);
    return false;
  }
  
  return true;
};

// Static method to find conversations for a user
conversationSchema.statics.findForUser = function(userId) {
  return this.find({
    'participants.userId': userId,
    'participants.leftAt': null
  }).sort({ updatedAt: -1 });
};

// Static method to find direct conversation between two users
conversationSchema.statics.findDirectConversation = function(user1Id, user2Id) {
  return this.findOne({
    type: 'direct',
    'participants.userId': { $all: [user1Id, user2Id] },
    'participants.leftAt': null
  });
};

module.exports = mongoose.model('Conversation', conversationSchema);

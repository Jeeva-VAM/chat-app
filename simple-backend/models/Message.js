const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
    default: 'text'
  },
  content: {
    text: {
      type: String,
      required: function() {
        return this.messageType === 'text' || this.messageType === 'system';
      },
      maxlength: 5000
    },
    mediaUrl: {
      type: String,
      required: function() {
        return ['image', 'file', 'audio', 'video'].includes(this.messageType);
      }
    },
    fileName: {
      type: String,
      required: function() {
        return this.messageType === 'file';
      }
    },
    fileSize: {
      type: Number,
      required: function() {
        return ['file', 'image', 'audio', 'video'].includes(this.messageType);
      }
    },
    duration: {
      type: Number, // in seconds, for audio/video
      required: function() {
        return ['audio', 'video'].includes(this.messageType);
      }
    },
    thumbnailUrl: {
      type: String // for video messages
    }
  },
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    senderId: String,
    text: String, // Preview text of replied message
    messageType: String
  },
  reactions: [{
    userId: {
      type: String,
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    userId: {
      type: String,
      required: true
    },
    name: String,
    startIndex: Number,
    length: Number
  }],
  readBy: [{
    userId: {
      type: String,
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    userId: {
      type: String,
      required: true
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  editHistory: [{
    originalText: String,
    editedAt: Date,
    editedBy: String
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  metadata: {
    deviceInfo: String,
    ipAddress: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for getting text content based on message type
messageSchema.virtual('displayText').get(function() {
  if (this.isDeleted) return 'This message was deleted';
  
  switch (this.messageType) {
    case 'text':
    case 'system':
      return this.content.text;
    case 'image':
      return '📷 Image';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🎵 Audio';
    case 'file':
      return `📎 ${this.content.fileName}`;
    default:
      return 'Message';
  }
});

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.userId === userId);
};

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
};

// Method to check if message is delivered to user
messageSchema.methods.isDeliveredTo = function(userId) {
  return this.deliveredTo.some(delivery => delivery.userId === userId);
};

// Method to mark message as delivered to user
messageSchema.methods.markAsDelivered = function(userId) {
  if (!this.isDeliveredTo(userId)) {
    this.deliveredTo.push({
      userId,
      deliveredAt: new Date()
    });
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction by the same user
  this.reactions = this.reactions.filter(r => r.userId !== userId);
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji = null) {
  if (emoji) {
    this.reactions = this.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
  } else {
    this.reactions = this.reactions.filter(r => r.userId !== userId);
  }
};

// Method to edit message
messageSchema.methods.editMessage = function(newText, editedBy) {
  if (this.content.text) {
    // Save edit history
    this.editHistory.push({
      originalText: this.content.text,
      editedAt: new Date(),
      editedBy
    });
    
    this.content.text = newText;
    this.isEdited = true;
  }
};

// Method to soft delete message
messageSchema.methods.deleteMessage = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
};

// Static method to find messages in conversation
messageSchema.statics.findInConversation = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('replyTo.messageId', 'content senderId createdAt');
};

// Static method to find unread messages for user
messageSchema.statics.findUnreadForUser = function(userId, conversationIds = []) {
  const query = {
    'readBy.userId': { $ne: userId },
    senderId: { $ne: userId },
    isDeleted: false
  };
  
  if (conversationIds.length > 0) {
    query.conversationId = { $in: conversationIds };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Message', messageSchema);
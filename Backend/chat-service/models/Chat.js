const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    }
  }],
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  chatName: {
    type: String,
    trim: true
  },
  chatImage: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: 500
  },
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String,
    senderId: mongoose.Schema.Types.ObjectId,
    senderName: String,
    timestamp: Date,
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'emoji', 'system'],
      default: 'text'
    }
  },
  encryptionKey: {
    type: String,
    required: true // Unique encryption key for this chat
  },
  settings: {
    allowMessagesFrom: {
      type: String,
      enum: ['everyone', 'participants'],
      default: 'everyone'
    },
    messageRetention: {
      type: Number,
      default: 0 // 0 means forever, otherwise days
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ isActive: 1, updatedAt: -1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => !p.leftAt).length;
});

// Methods
chatSchema.methods.addParticipant = function(userId, name, profileImage = '', role = 'member') {
  const existingParticipant = this.participants.find(
    p => p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (!existingParticipant) {
    this.participants.push({ 
      userId, 
      name, 
      profileImage, 
      role,
      joinedAt: new Date() 
    });
  }
  
  return this.save();
};

chatSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

chatSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    messageId: message._id,
    content: message.messageType === 'text' ? message.content.substring(0, 100) : `[${message.messageType}]`,
    senderId: message.senderId,
    senderName: message.senderName,
    timestamp: message.createdAt,
    messageType: message.messageType
  };
  
  return this.save();
};

chatSchema.methods.getActiveParticipants = function() {
  return this.participants.filter(p => !p.leftAt);
};

chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(
    p => p.userId.toString() === userId.toString() && !p.leftAt
  );
};

chatSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString() && !p.leftAt
  );
  return participant ? participant.role : null;
};

// Static methods
chatSchema.statics.findDirectChat = function(userId1, userId2) {
  return this.findOne({
    chatType: 'direct',
    isActive: true,
    'participants.userId': { $all: [userId1, userId2] },
    'participants.leftAt': { $exists: false }
  });
};

chatSchema.statics.getUserChats = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    'participants.userId': userId,
    'participants.leftAt': { $exists: false },
    isActive: true
  })
  .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
  .skip(skip)
  .limit(limit);
};

module.exports = mongoose.model('Chat', chatSchema);

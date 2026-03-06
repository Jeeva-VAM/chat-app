const { User, Conversation, Message } = require('../models');

class ChatService {
  // User operations
  static async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      return await User.findOne({ userId });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async updateUserOnlineStatus(userId, isOnline, socketId = null) {
    try {
      const updateData = { 
        isOnline, 
        lastSeen: new Date() 
      };
      
      if (socketId) {
        updateData.socketId = socketId;
      }
      
      return await User.findOneAndUpdate(
        { userId }, 
        updateData,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating user status: ${error.message}`);
    }
  }

  // Conversation operations
  static async createDirectConversation(user1Id, user2Id) {
    try {
      // Check if conversation already exists
      let conversation = await Conversation.findDirectConversation(user1Id, user2Id);
      
      if (!conversation) {
        conversation = new Conversation({
          type: 'direct',
          participants: [
            { userId: user1Id },
            { userId: user2Id }
          ]
        });
        
        // Initialize unread counts
        conversation.unreadCount = [
          { userId: user1Id, count: 0 },
          { userId: user2Id, count: 0 }
        ];
        
        await conversation.save();
      }
      
      return conversation;
    } catch (error) {
      throw new Error(`Error creating conversation: ${error.message}`);
    }
  }

  static async getUserConversations(userId) {
    try {
      return await Conversation.findForUser(userId)
        .populate('lastMessage.messageId', 'content createdAt messageType')
        .lean();
    } catch (error) {
      throw new Error(`Error fetching conversations: ${error.message}`);
    }
  }

  // Message operations
  static async sendMessage(messageData) {
    try {
      const { conversationId, senderId, messageType, content, replyTo, mentions } = messageData;
      
      // Create message
      const message = new Message({
        conversationId,
        senderId,
        messageType,
        content,
        replyTo,
        mentions
      });
      
      await message.save();
      
      // Update conversation with last message
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = {
          messageId: message._id,
          text: message.displayText,
          senderId: message.senderId,
          timestamp: message.createdAt,
          messageType: message.messageType
        };
        
        // Increment unread count for other participants
        conversation.incrementUnreadCount(senderId);
        
        await conversation.save();
      }
      
      return message;
    } catch (error) {
      throw new Error(`Error sending message: ${error.message}`);
    }
  }

  static async getConversationMessages(conversationId, page = 1, limit = 50) {
    try {
      return await Message.findInConversation(conversationId, page, limit);
    } catch (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }
  }

  static async markMessagesAsRead(conversationId, userId) {
    try {
      // Mark conversation as read
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.markAsRead(userId);
        await conversation.save();
      }
      
      // Mark individual messages as read
      const unreadMessages = await Message.find({
        conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
        isDeleted: false
      });
      
      for (const message of unreadMessages) {
        message.markAsRead(userId);
        await message.save();
      }
      
      return { success: true, markedCount: unreadMessages.length };
    } catch (error) {
      throw new Error(`Error marking messages as read: ${error.message}`);
    }
  }

  static async searchMessages(query, userId, conversationId = null) {
    try {
      const searchQuery = {
        'content.text': { $regex: query, $options: 'i' },
        isDeleted: false
      };
      
      if (conversationId) {
        searchQuery.conversationId = conversationId;
      } else {
        // Search in user's conversations only
        const userConversations = await Conversation.find({
          'participants.userId': userId,
          'participants.leftAt': null
        }).select('_id');
        
        searchQuery.conversationId = { 
          $in: userConversations.map(c => c._id) 
        };
      }
      
      return await Message.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('conversationId', 'type participants');
    } catch (error) {
      throw new Error(`Error searching messages: ${error.message}`);
    }
  }

  // Utility methods
  static async getUnreadCount(userId) {
    try {
      const conversations = await Conversation.find({
        'participants.userId': userId,
        'participants.leftAt': null
      });
      
      let totalUnread = 0;
      for (const conversation of conversations) {
        totalUnread += conversation.getUnreadCount(userId);
      }
      
      return totalUnread;
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }

  static async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user is sender
      if (message.senderId !== userId) {
        throw new Error('Unauthorized to delete this message');
      }
      
      message.deleteMessage(userId);
      await message.save();
      
      return message;
    } catch (error) {
      throw new Error(`Error deleting message: ${error.message}`);
    }
  }
}

module.exports = ChatService;

const express = require('express');
const router = express.Router();
const ChatService = require('../services/chatService');
const { User, Conversation, Message } = require('../models');


router.get('/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const conversations = await ChatService.getUserConversations(userId);
    
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== userId);
      
      return {
        id: conv._id,
        type: conv.type,
        name: conv.type === 'direct' ? otherParticipant?.userId : conv.name,
        avatar: conv.avatar,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.find(u => u.userId === userId)?.count || 0,
        isArchived: conv.isArchived.some(a => a.userId === userId),
        isPinned: conv.isPinned.some(p => p.userId === userId),
        isMuted: conv.isMutedForUser(userId),
        participants: conv.participants,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});


router.post('/conversations/direct', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;
    
    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }
    
    const conversation = await ChatService.createDirectConversation(user1Id, user2Id);
    res.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await ChatService.getConversationMessages(
      conversationId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({ 
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, messageType = 'text', content, replyTo, mentions } = req.body;
    
    if (!senderId) {
      return res.status(400).json({ error: 'senderId is required' });
    }
    
    if (messageType === 'text' && !content?.text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const messageData = {
      conversationId,
      senderId,
      messageType,
      content,
      replyTo,
      mentions
    };
    
    const message = await ChatService.sendMessage(messageData);
    
    // Populate message for response
    await message.populate('replyTo.messageId', 'content senderId createdAt');
    
    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.patch('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const result = await ChatService.markMessagesAsRead(conversationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search messages
router.get('/messages/search', async (req, res) => {
  try {
    const { q: query, userId, conversationId } = req.query;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'query and userId are required' });
    }
    
    const messages = await ChatService.searchMessages(query, userId, conversationId);
    res.json({ messages });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const unreadCount = await ChatService.getUnreadCount(userId);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const message = await ChatService.deleteMessage(messageId, userId);
    res.json({ message: 'Message deleted successfully', messageId });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Edit a message
router.patch('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, text } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this message' });
    }
    
    message.editMessage(text, userId);
    await message.save();
    
    res.json({ message });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    
    if (!userId || !emoji) {
      return res.status(400).json({ error: 'userId and emoji are required' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.addReaction(userId, emoji);
    await message.save();
    
    res.json({ message: 'Reaction added', reactions: message.reactions });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.removeReaction(userId, emoji);
    await message.save();
    
    res.json({ message: 'Reaction removed', reactions: message.reactions });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

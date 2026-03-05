const express = require('express');
const { body, query, validationResult } = require('express-validator');
const crypto = require('crypto');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { authMiddleware } = require('../../shared/auth');
const { encrypt, decrypt } = require('../../shared/encryption');
const { setCache, getCache } = require('../../shared/redis');

const router = express.Router();

// Auth middleware for all routes
router.use(authMiddleware);

// Create a new chat (direct or group)
router.post('/chats',
  [
    body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
    body('participants.*.userId').notEmpty().withMessage('Participant userId is required'),
    body('participants.*.name').notEmpty().withMessage('Participant name is required'),
    body('chatType').isIn(['direct', 'group']).withMessage('Invalid chat type'),
    body('chatName').optional().trim().isLength({ min: 1 }).withMessage('Chat name cannot be empty'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { participants, chatType, chatName, description } = req.body;

      // For direct chats, check if chat already exists
      if (chatType === 'direct') {
        if (participants.length !== 1) {
          return res.status(400).json({ error: 'Direct chat must have exactly one other participant' });
        }

        const otherUserId = participants[0].userId;
        const existingChat = await Chat.findDirectChat(req.user.userId, otherUserId);
        
        if (existingChat) {
          return res.json({ chat: existingChat });
        }
      }

      // Generate unique encryption key for this chat
      const encryptionKey = crypto.randomBytes(32).toString('hex');

      // Create chat
      const chat = new Chat({
        participants: [
          ...participants,
          {
            userId: req.user.userId,
            name: req.user.name,
            profileImage: '', // Will be populated from user service
            role: 'admin'
          }
        ],
        chatType,
        chatName: chatType === 'group' ? chatName : undefined,
        description,
        encryptionKey,
        createdBy: req.user.userId
      });

      await chat.save();

      // Cache the chat
      await setCache(`chat:${chat._id}`, chat, 3600);

      res.status(201).json({ 
        message: 'Chat created successfully',
        chat 
      });
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  }
);

// Get user's chats with recent messages
router.get('/chats',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Get user's chats
      const chats = await Chat.getUserChats(req.user.userId, page, limit);

      // Decrypt last message content for each chat
      const chatsWithDecryptedMessages = await Promise.all(
        chats.map(async (chat) => {
          const chatObj = chat.toObject();
          
          if (chatObj.lastMessage && chatObj.lastMessage.content) {
            try {
              chatObj.lastMessage.content = decrypt(chatObj.lastMessage.content);
            } catch (decryptError) {
              console.warn('Failed to decrypt last message:', decryptError);
              chatObj.lastMessage.content = '[Message unavailable]';
            }
          }

          // Get unread message count
          const unreadCount = await Message.countDocuments({
            chatId: chat._id,
            senderId: { $ne: req.user.userId },
            'readBy.userId': { $ne: req.user.userId }
          });

          chatObj.unreadCount = unreadCount;
          
          return chatObj;
        })
      );

      res.json({ chats: chatsWithDecryptedMessages });
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Failed to get chats' });
    }
  }
);

// Get chat details
router.get('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check cache first
    let chat = await getCache(`chat:${chatId}`);
    
    if (!chat) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      // Cache the chat
      await setCache(`chat:${chatId}`, chat, 3600);
    }

    // Verify user is participant
    if (!chat.isParticipant(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({ error: 'Failed to get chat details' });
  }
});

// Get chat messages with pagination
router.get('/chats/:chatId/messages',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Before must be a valid date')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { chatId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const before = req.query.before;

      // Verify user is participant
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(req.user.userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Build query
      const query = { 
        chatId,
        deleted: false 
      };

      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      // Get messages
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('replyTo', 'content senderName createdAt')
        .lean();

      // Decrypt message content
      const decryptedMessages = messages.map(message => {
        try {
          return {
            ...message,
            content: decrypt(message.content)
          };
        } catch (decryptError) {
          console.warn('Failed to decrypt message:', decryptError);
          return {
            ...message,
            content: '[Message unavailable]'
          };
        }
      }).reverse(); // Reverse to show oldest first

      res.json({ 
        messages: decryptedMessages,
        hasMore: messages.length === limit
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }
);

// Send a message
router.post('/chats/:chatId/messages',
  [
    body('content').notEmpty().trim().withMessage('Message content is required'),
    body('messageType').optional().isIn(['text', 'image', 'file', 'emoji']).withMessage('Invalid message type'),
    body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { chatId } = req.params;
      const { content, messageType = 'text', replyTo, attachments = [] } = req.body;

      // Verify user is participant
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(req.user.userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Encrypt message content
      const encryptedContent = encrypt(content);

      // Create message
      const message = new Message({
        chatId,
        senderId: req.user.userId,
        senderName: req.user.name,
        content: encryptedContent,
        messageType,
        attachments,
        replyTo
      });

      await message.save();

      // Update chat's last message
      await chat.updateLastMessage(message);

      // Return decrypted message
      const responseMessage = {
        ...message.toObject(),
        content: content
      };

      res.status(201).json({ 
        message: 'Message sent successfully',
        data: responseMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// Mark messages as read
router.patch('/chats/:chatId/messages/:messageId/read', async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await Message.findById(messageId);
    if (!message || message.chatId.toString() !== chatId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.markAsRead(req.user.userId);

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Add participants to group chat
router.post('/chats/:chatId/participants',
  [
    body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
    body('participants.*.userId').notEmpty().withMessage('Participant userId is required'),
    body('participants.*.name').notEmpty().withMessage('Participant name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { chatId } = req.params;
      const { participants } = req.body;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Only group chats can have participants added
      if (chat.chatType !== 'group') {
        return res.status(400).json({ error: 'Can only add participants to group chats' });
      }

      // Check if user has permission (admin or creator)
      const userRole = chat.getParticipantRole(req.user.userId);
      if (userRole !== 'admin' && chat.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Add participants
      for (const participant of participants) {
        await chat.addParticipant(participant.userId, participant.name, participant.profileImage);
      }

      res.json({ 
        message: 'Participants added successfully',
        chat 
      });
    } catch (error) {
      console.error('Add participants error:', error);
      res.status(500).json({ error: 'Failed to add participants' });
    }
  }
);

// Remove participant from group chat
router.delete('/chats/:chatId/participants/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Only group chats can have participants removed
    if (chat.chatType !== 'group') {
      return res.status(400).json({ error: 'Can only remove participants from group chats' });
    }

    // Check permissions
    const requesterRole = chat.getParticipantRole(req.user.userId);
    const isCreator = chat.createdBy.toString() === req.user.userId;
    const isSelfRemoval = userId === req.user.userId;

    if (!isSelfRemoval && requesterRole !== 'admin' && !isCreator) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await chat.removeParticipant(userId);

    res.json({ 
      message: 'Participant removed successfully',
      chat 
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Search messages in a chat
router.get('/chats/:chatId/search',
  [
    query('q').notEmpty().trim().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { chatId } = req.params;
      const { q: searchQuery } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Verify user is participant
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(req.user.userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all messages and decrypt for search
      // Note: This is a simplified approach. In production, you'd want to implement
      // a more efficient search mechanism, possibly using encrypted search or indexing
      const allMessages = await Message.find({ 
        chatId,
        deleted: false 
      }).sort({ createdAt: -1 });

      const searchResults = [];
      
      for (const message of allMessages) {
        try {
          const decryptedContent = decrypt(message.content);
          if (decryptedContent.toLowerCase().includes(searchQuery.toLowerCase())) {
            searchResults.push({
              ...message.toObject(),
              content: decryptedContent
            });
          }
        } catch (decryptError) {
          // Skip messages that can't be decrypted
          continue;
        }
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedResults = searchResults.slice(startIndex, startIndex + limit);

      res.json({
        messages: paginatedResults,
        total: searchResults.length,
        page,
        limit,
        hasMore: startIndex + limit < searchResults.length
      });
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  }
);

module.exports = router;

const { verifyToken } = require('../../shared/auth');
const { setCache, getCache, deleteCache } = require('../../shared/redis');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { encrypt, decrypt } = require('../../shared/encryption');
const { publishMessage } = require('../../shared/kafka');

class SocketService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId mapping
  }

  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userName = decoded.name;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.userName} (${socket.userId})`);
    
    // Store user socket mapping
    this.userSockets.set(socket.userId, socket.id);
    
    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);
    
    // Update user status to online
    this.updateUserStatus(socket.userId, 'online');
    
    // Socket event handlers
    this.setupEventHandlers(socket);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      this.userSockets.delete(socket.userId);
      this.updateUserStatus(socket.userId, 'offline');
    });
  }

  setupEventHandlers(socket) {
    // Join chat room
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        
        // Verify user is participant
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized to join this chat' });
          return;
        }
        
        socket.join(chatId);
        socket.emit('joined_chat', { chatId });
        
        // Notify others that user joined (for online status)
        socket.to(chatId).emit('user_online', { 
          userId: socket.userId, 
          userName: socket.userName 
        });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      socket.to(chatId).emit('user_offline', { 
        userId: socket.userId, 
        userName: socket.userName 
      });
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        await this.handleSendMessage(socket, data);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark message as read
    socket.on('mark_read', async (data) => {
      try {
        await this.handleMarkAsRead(socket, data);
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', { 
        userId: socket.userId, 
        userName: socket.userName 
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_stopped_typing', { 
        userId: socket.userId 
      });
    });

    // Message reactions
    socket.on('add_reaction', async (data) => {
      try {
        await this.handleAddReaction(socket, data);
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        await this.handleEditMessage(socket, data);
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        await this.handleDeleteMessage(socket, data);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });
  }

  async handleSendMessage(socket, data) {
    const { chatId, content, messageType = 'text', replyTo, attachments = [] } = data;
    
    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(socket.userId)) {
      socket.emit('error', { message: 'Unauthorized to send message to this chat' });
      return;
    }

    // Encrypt message content
    const encryptedContent = encrypt(content);

    // Create message
    const message = new Message({
      chatId,
      senderId: socket.userId,
      senderName: socket.userName,
      senderProfileImage: '', // Will be populated from user service
      content: encryptedContent,
      messageType,
      attachments,
      replyTo
    });

    await message.save();

    // Update chat's last message
    await chat.updateLastMessage(message);

    // Decrypt content for real-time broadcasting
    const messageForBroadcast = {
      ...message.toObject(),
      content: content // Send decrypted content for real-time
    };

    // Broadcast to all participants in the chat
    this.io.to(chatId).emit('new_message', messageForBroadcast);

    // Publish to Kafka for other services
    await publishMessage('messages', {
      chatId,
      messageId: message._id,
      senderId: socket.userId,
      senderName: socket.userName,
      content: encryptedContent, // Keep encrypted in Kafka
      messageType,
      timestamp: message.createdAt,
      participants: chat.getActiveParticipants().map(p => p.userId)
    });

    // Send delivery confirmation to sender
    socket.emit('message_sent', { 
      messageId: message._id,
      timestamp: message.createdAt 
    });
  }

  async handleMarkAsRead(socket, data) {
    const { messageId } = data;
    
    const message = await Message.findById(messageId);
    if (!message) return;

    // Verify user is participant of the chat
    const chat = await Chat.findById(message.chatId);
    if (!chat || !chat.isParticipant(socket.userId)) return;

    await message.markAsRead(socket.userId);

    // Notify sender that message was read
    this.io.to(message.chatId).emit('message_read', {
      messageId,
      readBy: socket.userId,
      readAt: new Date()
    });
  }

  async handleAddReaction(socket, data) {
    const { messageId, emoji } = data;
    
    const message = await Message.findById(messageId);
    if (!message) return;

    // Verify user is participant
    const chat = await Chat.findById(message.chatId);
    if (!chat || !chat.isParticipant(socket.userId)) return;

    await message.addReaction(socket.userId, emoji);

    // Broadcast reaction to all participants
    this.io.to(message.chatId).emit('reaction_added', {
      messageId,
      userId: socket.userId,
      userName: socket.userName,
      emoji
    });
  }

  async handleEditMessage(socket, data) {
    const { messageId, newContent } = data;
    
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    // Only sender can edit their message
    if (message.senderId.toString() !== socket.userId) {
      socket.emit('error', { message: 'Unauthorized to edit this message' });
      return;
    }

    // Encrypt new content
    const encryptedContent = encrypt(newContent);
    
    message.content = encryptedContent;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    // Broadcast edit to all participants
    this.io.to(message.chatId).emit('message_edited', {
      messageId,
      newContent, // Send decrypted for real-time
      edited: true,
      editedAt: message.editedAt
    });
  }

  async handleDeleteMessage(socket, data) {
    const { messageId } = data;
    
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== socket.userId) {
      socket.emit('error', { message: 'Unauthorized to delete this message' });
      return;
    }

    await message.softDelete();

    // Broadcast deletion to all participants
    this.io.to(message.chatId).emit('message_deleted', {
      messageId,
      deletedAt: message.deletedAt
    });
  }

  async updateUserStatus(userId, status) {
    try {
      // Update status in cache
      await setCache(`user_status:${userId}`, { status, lastSeen: new Date() }, 300);
      
      // Notify all connected users about status change
      this.io.emit('user_status_changed', { userId, status });
    } catch (error) {
      console.error('Update user status error:', error);
    }
  }

  // Get online users for a chat
  async getOnlineUsers(chatId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return [];

      const onlineUsers = [];
      for (const participant of chat.getActiveParticipants()) {
        const status = await getCache(`user_status:${participant.userId}`);
        if (status && status.status === 'online') {
          onlineUsers.push({
            userId: participant.userId,
            name: participant.name,
            profileImage: participant.profileImage
          });
        }
      }

      return onlineUsers;
    } catch (error) {
      console.error('Get online users error:', error);
      return [];
    }
  }
}

module.exports = SocketService;

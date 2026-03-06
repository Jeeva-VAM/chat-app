import apiService from './api';

class ChatApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api/chat';
  }

  // Get user's conversations
  async getUserConversations(userId) {
    try {
      const response = await fetch(`${this.baseURL}/conversations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Create or get direct conversation
  async createDirectConversation(user1Id, user2Id) {
    try {
      const response = await fetch(`${this.baseURL}/conversations/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id, user2Id })
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await fetch(`${this.baseURL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId, messageData) {
    try {
      const response = await fetch(`${this.baseURL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      const response = await fetch(`${this.baseURL}/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(query, userId, conversationId = null) {
    try {
      const params = new URLSearchParams({ q: query, userId });
      if (conversationId) params.append('conversationId', conversationId);
      
      const response = await fetch(`${this.baseURL}/messages/search?${params}`);
      if (!response.ok) throw new Error('Failed to search messages');
      return await response.json();
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const response = await fetch(`${this.baseURL}/unread-count?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to get unread count');
      return await response.json();
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId, userId) {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId, userId, text) {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text })
      });
      if (!response.ok) throw new Error('Failed to edit message');
      return await response.json();
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Add reaction
  async addReaction(messageId, userId, emoji) {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emoji })
      });
      if (!response.ok) throw new Error('Failed to add reaction');
      return await response.json();
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction
  async removeReaction(messageId, userId, emoji = null) {
    try {
      const response = await fetch(`${this.baseURL}/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emoji })
      });
      if (!response.ok) throw new Error('Failed to remove reaction');
      return await response.json();
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }
}

export default new ChatApiService();
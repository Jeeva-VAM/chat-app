
const API_BASE_URL = 'http://localhost:3001/api';  

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      headers: defaultHeaders,
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error(`💥 API request failed for ${url}:`, error);
      throw error;
    }
  }

  // Profile endpoints
  async getUserProfile(userId) {
    return this.request(`/profile/${userId}`);
  }

  async createOrUpdateProfile(profileData) {
    return this.request('/profile', {
      method: 'POST',
      body: profileData
    });
  }

  async updateUserProfile(userId, profileData) {
    return this.request(`/profile/${userId}`, {
      method: 'PATCH',
      body: profileData
    });
  }

  async getAllProfiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/profiles?${queryString}`);
  }

  async getSuggestedUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/profiles?${queryString}`);
  }

  async deleteProfile(userId) {
    return this.request(`/profile/${userId}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async checkHealth() {
    return this.request('/health', {
      method: 'GET'
    });
  }

  // Message endpoints
  async getUserConversations(userId) {
    return this.request(`/conversations/${userId}`);
  }

  async getConversationMessages(conversationId, page = 1, limit = 50) {
    return this.request(`/messages/${conversationId}?page=${page}&limit=${limit}`);
  }

  async sendMessage(messageData) {
    return this.request('/messages', {
      method: 'POST',
      body: messageData
    });
  }

  async markMessagesAsRead(conversationId, userId) {
    return this.request(`/messages/read/${conversationId}`, {
      method: 'PATCH',
      body: { userId }
    });
  }

  async searchMessages(userId, query) {
    return this.request(`/messages/search/${userId}?q=${encodeURIComponent(query)}`);
  }
}

export default new ApiService();
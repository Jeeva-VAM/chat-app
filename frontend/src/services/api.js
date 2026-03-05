
const API_BASE_URL = 'http://localhost:3001/api';  

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
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
}

export default new ApiService();
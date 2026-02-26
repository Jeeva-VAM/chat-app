const axios = require('axios');

// Redis API configuration
const REDIS_API_URL = process.env.REDIS_API_URL || 'https://api.upstash.com/v2/redis';
const REDIS_API_TOKEN = process.env.REDIS_API_TOKEN;

let isRedisApiEnabled = false;

// Initialize Redis API service
const initializeRedisApi = () => {
  if (REDIS_API_TOKEN && REDIS_API_URL) {
    isRedisApiEnabled = true;
    console.log('Redis API service enabled');
    return true;
  } else {
    console.log('Redis API not configured - running without cache');
    return false;
  }
};

// Make API request to Redis service
const makeRedisRequest = async (command, args = []) => {
  if (!isRedisApiEnabled) return null;
  
  try {
    const response = await axios.post(
      REDIS_API_URL,
      [command, ...args],
      {
        headers: {
          'Authorization': `Bearer ${REDIS_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    return response.data.result;
  } catch (error) {
    console.warn('Redis API request failed (continuing without cache):', error.message);
    return null;
  }
};

const connectRedis = async () => {
  return initializeRedisApi();
};

const getRedisClient = () => {
  return isRedisApiEnabled ? { isEnabled: true } : null;
};

const setCache = async (key, value, ttl = 3600) => {
  try {
    if (isRedisApiEnabled) {
      await makeRedisRequest('SETEX', [key, ttl, JSON.stringify(value)]);
      return true;
    }
    return null;
  } catch (error) {
    console.warn('Redis API set failed:', error.message);
    return null;
  }
};

const getCache = async (key) => {
  try {
    if (isRedisApiEnabled) {
      const value = await makeRedisRequest('GET', [key]);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    console.warn('Redis API get failed:', error.message);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    if (isRedisApiEnabled) {
      await makeRedisRequest('DEL', [key]);
      return true;
    }
    return null;
  } catch (error) {
    console.warn('Redis API delete failed:', error.message);
    return null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache
};

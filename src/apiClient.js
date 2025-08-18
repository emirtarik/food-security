// src/apiClient.js
import axios from 'axios';

// For local development, you can choose between:
// 1. Direct connection to backend (current setting)
// 2. Using the proxy configuration in package.json
const useProxy = false; // Set to true if you want to use the proxy instead

export const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? useProxy 
        ? '/'  // Use proxy configuration from package.json
        : 'http://localhost:5001'  // Direct connection to local backend
      : process.env.REACT_APP_API_URL,
  withCredentials: true,
});

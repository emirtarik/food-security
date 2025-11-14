// src/apiClient.js
import axios from 'axios';

// For local development, you can choose between:
// 1. Direct connection to backend (current setting)
// 2. Using the proxy configuration in package.json
const useProxy = false; // Set to true if you want to use the proxy instead

// Production backend URL
const PRODUCTION_API_URL = 'https://food-security-back.azurewebsites.net';

export const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? useProxy 
        ? '/'  // Use proxy configuration from package.json
        : 'http://localhost:5001'  // Direct connection to local backend
      : (process.env.REACT_APP_API_URL || PRODUCTION_API_URL), // Fallback to hardcoded URL if env var missing
  withCredentials: true,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      environment: process.env.NODE_ENV
    });
    return config;
  },
  (error) => {
    console.error(' API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log(' API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(' API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      response: error.response?.data
    });
    return Promise.reject(error);
  }
);
// src/apiClient.js

const PRESIGN_URL = process.env.REACT_APP_PRESIGN_URL || "";
const META_URL    = process.env.REACT_APP_META_URL    || "";


export async function presignPut(key, contentType) {
  const url = `${PRESIGN_URL}?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`presign failed: ${res.status}`);
  const data = await res.json();
 
  return data.url || data;
}

export async function uploadWithPut(presignedUrl, blob, contentType) {
  const r = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!r.ok) throw new Error(`upload failed: ${r.status}`);
}

export async function saveMetadata(record) {
  const r = await fetch(META_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!r.ok) throw new Error(`metadata save failed: ${r.status}`);
}


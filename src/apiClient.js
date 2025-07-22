// src/apiClient.js
import axios from 'axios';

export const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? '/'                          // CRA proxy → http://localhost:5001
      : process.env.REACT_APP_API_URL,
  withCredentials: true,
});

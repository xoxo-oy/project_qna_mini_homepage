import axios from "axios";

// NOTE: In a real scenario, this points to your Node.js backend.
// For this demo, if the backend isn't running, requests will fail.
const API_URL = "http://220.93.220.93:3001/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for httpOnly cookies
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      // window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;

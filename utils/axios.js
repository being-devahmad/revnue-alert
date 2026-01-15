import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Get API URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_DEVELOPMENT_API_URL
  || "https://renewalert.com/api";


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ REQUEST INTERCEPTOR - Add token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get FULL token from AsyncStorage (including the 26| prefix)
      const token = await AsyncStorage.getItem("authToken");

      // If token exists, add it to headers
      // For Laravel Sanctum: use the FULL token including 26| prefix
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No token found in AsyncStorage');
      }
    } catch (error) {
      console.error("❌ Error getting token in interceptor:", error);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    ;
    return response;
  },
  (error) => {
    // Handle 401 (Unauthorized) errors
    if (error.response?.status === 401) {
      console.error('🔐 401 Unauthorized');

      // Clear auth data
      AsyncStorage.removeItem("authToken");
      AsyncStorage.removeItem("userData");

      // Optionally navigate to login
      // You might want to dispatch an action here
    }

    console.error('📥 Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      responseMessage: error.response?.data?.message,
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;
import axiosInstance from '@/utils/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface LogoutResponse {
  status: boolean;
  message: string;
}

export interface LogoutError {
  message: string;
  code?: string;
}

// ============ LOGOUT FUNCTION ============
const performLogout = async (): Promise<LogoutResponse> => {
  try {
    console.log('🚪 Initiating logout...');

    // Call logout API endpoint
    const response = await axiosInstance.post<LogoutResponse>('/logout');

    console.log('✅ Logout API response:', {
      status: response.data.status,
      message: response.data.message,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Logout failed');
    }

    // Clear local auth data regardless of API response
    // This ensures user is logged out even if API has issues
    console.log('🧹 Clearing local auth data...');
    
    await Promise.all([
      AsyncStorage.removeItem('authToken'),
      AsyncStorage.removeItem('userData'),
      AsyncStorage.removeItem('userPreferences'),
    ]);

    console.log('✅ Local auth data cleared');

    // Clear axios interceptor cache if needed
    // Reset any app state here if needed
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error during logout:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Even if API fails, clear local data for security
    console.log('🧹 Clearing local data due to API error...');
    try {
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('userPreferences'),
      ]);
      console.log('✅ Local data cleared despite API error');
    } catch (clearError) {
      console.error('❌ Error clearing local data:', clearError);
    }

    // Re-throw error for proper error handling
    throw error;
  }
};

// ============ USE LOGOUT HOOK ============
export const useLogout = () => {
  return useMutation({
    mutationFn: performLogout,
    onSuccess: (data) => {
      console.log('✅ Logout mutation successful');
    },
    onError: (error: any) => {
      console.error('❌ Logout mutation error:', error.message);
    },
  });
};

// ============ HELPER: LOGOUT WITH REDIRECT ============
export const logoutAndRedirect = async (
  onRedirect: () => void
): Promise<void> => {
  try {
    await performLogout();
    console.log('🔄 Redirecting to login...');
    onRedirect();
  } catch (error) {
    console.error('Error during logout and redirect:', error);
    // Still redirect even if API fails
    console.log('🔄 Redirecting to login despite error...');
    onRedirect();
  }
};

// ============ HELPER: CHECK IF LOGGED IN ============
export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const user = await AsyncStorage.getItem('userData');
    
    console.log('🔍 Auth check:', {
      hasToken: !!token,
      hasUser: !!user,
    });

    return !!(token && user);
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// ============ HELPER: GET STORED USER ============
export const getStoredUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error retrieving stored user:', error);
    return null;
  }
};

// ============ HELPER: GET AUTH TOKEN ============
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// ============ HELPER: CLEAR ALL AUTH DATA ============
export const clearAllAuthData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all auth data...');
    
    await Promise.all([
      AsyncStorage.removeItem('authToken'),
      AsyncStorage.removeItem('userData'),
      AsyncStorage.removeItem('userPreferences'),
    ]);

    console.log('✅ All auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};
import axiosInstance from '@/utils/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

export interface RegisterRequest {
  first_name: string;
  middle_name?: string;
  last_name: string;
  company?: string;
  industry_id: number;
  email: string;
  password: string;
  password_confirmation: string;
  enterprise: boolean;
  platform: 'ios' | 'android';
  promo_code?: string;
  app_plan_id?: number;
}


export interface RegisterUser {
  id: number;
  name: string;
  email: string;
  enterprise: boolean;
}

export interface RegisterResponse {
  status: boolean;
  message: string;
  data: {
    user: RegisterUser;
    token?: string;
    access_token?: string;
  };
}

/**
 * API call to register a new user
 * @param data - Registration request data
 * @returns Promise with registration response
 */
const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    console.log('🔄 Registering user...', {
      email: data.email,
      name: `${data.first_name} ${data.last_name}`,
      platform: data.platform,
      enterprise: data.enterprise,
    });


    const response = await axiosInstance.post<RegisterResponse>('/register', data);

    // Validate response
    if (!response.data) {
      throw new Error('No response data from API');
    }

    if (!response.data.status) {
      throw new Error(response.data.message || 'Registration failed');
    }

    if (!response.data.data?.user) {
      throw new Error('Invalid response structure');
    }

    console.log('✅ Registration successful!', {
      userId: response.data.data.user.id,
      name: response.data.data.user.name,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Registration error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Handle specific error messages
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors)
        .flat()
        .join(', ');
      throw new Error(errorMessages);
    }

    throw error;
  }
};

/**
 * useRegister Hook - Handles user registration and token management
 * 
 * ⭐ KEY CHANGES:
 * - Automatically saves auth token to AsyncStorage after registration
 * - Handles both 'token' and 'access_token' responses
 * - Verifies token was saved successfully
 * - Console logs for debugging token flow
 * 
 * Usage:
 * ```
 * const { register, isPending, error } = useRegister();
 * 
 * register(
 *   {
 *     first_name: "John",
 *     last_name: "Doe",
 *     email: "john@example.com",
 *     password: "password123",
 *     password_confirmation: "password123",
 *     industry_id: 9,
 *     product_id: "prod_...",
 *     price_id: "price_...",
 *     card_token: "tok_visa",
 *   },
 *   {
 *     onSuccess: (data) => {
 *       console.log("User registered:", data.data.user);
 *     },
 *     onError: (error) => {
 *       Alert.alert("Error", error.message);
 *     },
 *   }
 * );
 * ```
 */
export const useRegister = () => {
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      console.log('🎯 useRegister mutation success:', {
        message: data.message,
        userId: data.data.user.id,
      });

      // ⭐ CRITICAL: Save token to AsyncStorage
      console.log("\n🔐 ===== TOKEN HANDLING =====");

      // Extract token (could be 'token' or 'access_token')
      const token = data.data.token || data.data.access_token;

      if (token) {
        console.log("✅ Token found in response!");
        console.log(`📝 Token (first 20 chars): ${token.substring(0, 20)}...`);

        try {
          // ⭐ SAVE TOKEN TO ASYNCSTORAGE (THIS IS THE FIX!)
          await AsyncStorage.setItem("authToken", token);
          console.log("✅ Token SAVED to AsyncStorage!");

          // Verify token was saved
          const savedToken = await AsyncStorage.getItem("authToken");
          if (savedToken) {
            console.log("✅ Verification: Token retrieved from AsyncStorage");
            console.log(`📝 Saved token (first 20 chars): ${savedToken.substring(0, 20)}...`);
          } else {
            console.warn("⚠️  Token was not saved properly!");
          }
        } catch (error) {
          console.error("❌ Error saving token to AsyncStorage:", error);
        }
      } else {
        console.warn("⚠️  No token in API response!");
        console.log("📋 Response data:", JSON.stringify(data, null, 2));
      }

      console.log("✅ Registration & token handling complete!\n");
    },
    onError: (error: any) => {
      console.error('🎯 useRegister mutation error:', {
        message: error.message,
      });
    },
  });

  return {
    ...mutation,
    register: mutation.mutate,
    isLoading: mutation.isPending,
  };
};
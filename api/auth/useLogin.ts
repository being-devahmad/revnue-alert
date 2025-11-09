import axiosInstance from "@/utils/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";

interface LoginRequest {
  email: string;
  password: string;
}

interface UserData {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  company: string;
  department: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  stripe_active: number;
  stripe_id: string;
  stripe_subscription: string;
  stripe_plan: string;
  last_four: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  industry_id: number;
}

interface LoginResponse {
  status: boolean;
  message: string;
  token: string;
  user: UserData;
}

const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>("/login", credentials);
  return response.data;
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      // Store the token in AsyncStorage
      if (data.token) {
        await AsyncStorage.setItem("authToken", data.token);
      }

      // Optionally store user data
      if (data.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
      }
    },
    onError: (error: any) => {
      // Handle errors globally or let the component handle them
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      console.error("Login error:", errorMessage);
    },
  });
};
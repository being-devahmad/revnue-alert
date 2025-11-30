import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/utils/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  verified: boolean;
  account_type: string;
  enterprise: boolean;
}

const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>("/login", credentials);
  return response.data;
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const { login: storeLogin } = useAuthStore();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      console.log("Login response data:", data);

      // Store the token in AsyncStorage
      if (data.token) {
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("accountType", data.account_type);
      }

      // Optionally store user data
      if (data.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
        await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      }

      // ✅ Update Zustand auth store with new user data
      await storeLogin(data.token, data.user, data.account_type);

      // ✅ KEY FIX: Invalidate all dashboard queries so they refetch with new user
      // This clears the cache for the old user's dashboard data
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      console.log("✅ Dashboard cache invalidated - new user data will be fetched");
    },
    onError: (error: any) => {
      // Handle errors globally or let the component handle them
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      console.error("Login error:", errorMessage);
    },
  });
};
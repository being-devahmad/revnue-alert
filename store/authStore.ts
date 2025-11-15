import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  isLoadingAuth: boolean;

  // Actions
  login: (token: string, user?: any) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  loadToken: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoadingAuth: true, // Start as true while loading

  // Login shortcut (used after API login)
  login: async (token: string, user: any = null) => {
    try {
      await AsyncStorage.setItem("authToken", token);
      if (user) {
        await AsyncStorage.setItem("authUser", JSON.stringify(user));
      }
      set({ token, user, isLoadingAuth: false });
    } catch (err) {
      console.error("AuthStore login error:", err);
      set({ isLoadingAuth: false });
    }
  },

  // Same as before (kept for compatibility)
  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem("authToken", token);
      set({ token, isLoadingAuth: false });
    } catch (err) {
      console.error("AuthStore setToken error:", err);
      set({ isLoadingAuth: false });
    }
  },

  // Load token on app launch
  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userStr = await AsyncStorage.getItem("authUser");

      set({
        token: token || null,
        user: userStr ? JSON.parse(userStr) : null,
        isLoadingAuth: false, // Finished loading
      });
    } catch (err) {
      console.error("AuthStore loadToken error:", err);
      set({ isLoadingAuth: false });
    }
  },

  // Logout: wipe everything
  logout: async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("authUser");
      set({ token: null, user: null, isLoadingAuth: false });
    } catch (err) {
      console.error("AuthStore logout error:", err);
    }
  },
}));
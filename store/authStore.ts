import { SubscriptionData } from "@/api/auth/useLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases from "react-native-purchases";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  accountType: string | null;
  isLoadingAuth: boolean;
  subscription: SubscriptionData | null;

  // Actions
  login: (token: string, user?: any, accountType?: string | null, subscription?: SubscriptionData | null) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  loadToken: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  accountType: null,
  isLoadingAuth: true, // Start as true while loading
  subscription: null,

  // Login shortcut (used after API login)
  login: async (token: string, user: any = null, accountType: string | null = null, subscription: SubscriptionData | null = null) => {
    try {
      await AsyncStorage.setItem("authToken", token);
      if (user) {
        await AsyncStorage.setItem("authUser", JSON.stringify(user));
      }
      if (accountType) {
        await AsyncStorage.setItem("accountType", accountType);
      }
      if (subscription) {
        await AsyncStorage.setItem("userSubscription", JSON.stringify(subscription));
      }

      // ✅ Log in to RevenueCat if user exists
      if (user) {
        const userId = user.rc_app_user_id ?? user.id.toString();
        try {
          console.log(`👤 Identifying in RevenueCat: ${userId}`);
          await Purchases.logIn(userId);
        } catch (rcError) {
          console.warn("⚠️ RevenueCat login error:", rcError);
        }
      }

      set({ token, user, accountType, subscription, isLoadingAuth: false });
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
      const accountType = await AsyncStorage.getItem("accountType");
      const subscriptionStr = await AsyncStorage.getItem("userSubscription");

      set({
        token: token || null,
        user: userStr ? JSON.parse(userStr) : null,
        accountType: accountType || null,
        subscription: subscriptionStr ? JSON.parse(subscriptionStr) : null,
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
      await AsyncStorage.removeItem("accountType");
      await AsyncStorage.removeItem("userSubscription");

      // ✅ Log out of RevenueCat
      try {
        await Purchases.logOut();
        console.log("✅ RevenueCat logout successful");
      } catch (rcError) {
        console.warn("⚠️ RevenueCat logout error:", rcError);
      }

      set({ token: null, user: null, accountType: null, subscription: null, isLoadingAuth: false });
    } catch (err) {
      console.error("AuthStore logout error:", err);
    }
  },
}));
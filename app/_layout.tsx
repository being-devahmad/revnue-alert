import SplashScreen from "@/components/SplashScreen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import React, { useEffect, useState } from "react";
// import Purchases from "react-native-purchases";
import Purchases, { LOG_LEVEL } from 'react-native-purchases';


import { Platform } from "react-native";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const [appIsReady, setAppIsReady] = useState(false);

  const EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51SHknHI8Xjdh0k1MqhPNksWxi985u7AyKA3cYvmOaFgtB12TaNNKAskfVkjgiEC8UprCHWAeOZEfYxli7IvsZ5ut00GOHlrljC";

  // RevenueCat API Keys
  // const REVENUECAT_API_KEY = "test_KdiZCShzAuoJCILJxZEAZvOgriL"
  const REVENUECAT_API_KEY = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS || "appl_zjAyHXHkAqpVjHokWhDTYlBvwEa", // Add your iOS key here
    // android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || "goog_placeholder_key", // Add your Android key here
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent native splash from auto hiding
        await SplashScreenExpo.preventAutoHideAsync();

        // Load token or any initial data
        await loadToken();

        // Configure RevenueCat
        if (REVENUECAT_API_KEY) {
          console.log("🛠️ Configuring RevenueCat...");
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

          Purchases.configure({ apiKey: REVENUECAT_API_KEY });

          // Login if user exists logic
          const user = useAuthStore.getState().user;
          if (user && user.id) {
            const userId = user.rc_app_user_id || user.id.toString();
            console.log(`👤 Found logged-in user. Identifying in RevenueCat: ${userId}`);
            await Purchases.logIn(userId);

            // Only fetch info if identified (to avoid anonymous user spam)
            console.log("✅ RevenueCat configured & identified. Fetching Info...");
            await Purchases.getCustomerInfo().then((info) => console.log(info));
          } else {
            console.log("ℹ️ User not logged in. Skipping RevenueCat identification & info fetch to prevent anonymous spam.");
          }

          console.log("✅ RevenueCat configured successfully");

        } else {
          console.warn("⚠️ RevenueCat API Key missing");
        }


        // Optional: short delay to show animated splash
        setTimeout(() => {
          setAppIsReady(true);
        }, 2500); // duration of animated splash
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loadToken]);

  useEffect(() => {
    if (appIsReady) {
      console.log("App is ready, hiding splash screen", appIsReady);
      // Hide native splash only after animated splash finishes
      SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <SplashScreen />;
  }

  return (
    <StripeProvider
      publishableKey={EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      threeDSecureParams={{
        backgroundColor: "#FFF",
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth-check)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </StripeProvider>
  );
}
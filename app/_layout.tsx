import SplashScreen from "@/components/SplashScreen";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const [appIsReady, setAppIsReady] = useState(false);

  const EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51SHknHI8Xjdh0k1MqhPNksWxi985u7AyKA3cYvmOaFgtB12TaNNKAskfVkjgiEC8UprCHWAeOZEfYxli7IvsZ5ut00GOHlrljC";

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent native splash from auto hiding
        await SplashScreenExpo.preventAutoHideAsync();

        // Load token or any initial data
        await loadToken();

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
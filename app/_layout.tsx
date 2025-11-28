import SplashScreen from "@/components/SplashScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);
  const [appIsReady, setAppIsReady] = useState(false);

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
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth-check)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" /> {/* Expo Router automatically loads tabs layout */}
      </Stack>
    </QueryClientProvider>
  );
}

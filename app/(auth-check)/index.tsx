import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function AuthCheck() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isLoadingAuth = useAuthStore((s) => s.isLoadingAuth);
  const [routeDecided, setRouteDecided] = useState(false);

  console.log('token--->', token);
  console.log('isLoadingAuth--->', isLoadingAuth);

  useEffect(() => {
    // Only navigate once loading is complete AND token state is determined
    if (!isLoadingAuth && !routeDecided) {
      setRouteDecided(true);
      
      if (token === null) {
        console.log('No token, navigating to login');
        router.replace("/(auth)/login");
      } else {
        console.log('Token found, navigating to dashboard');
        router.replace("/(tabs)");
      }
    }
  }, [isLoadingAuth, token, routeDecided]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
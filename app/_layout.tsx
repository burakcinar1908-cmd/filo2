import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../src/store/authStore";
import { colors } from "../src/theme/colors";

export default function RootLayout() {
  const { isLoading, isAuthenticated, role, bootstrap } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      if (role === "personnel") router.replace("/(driver)/home");
      else router.replace("/(admin)/home");
    }
  }, [isLoading, isAuthenticated, role, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

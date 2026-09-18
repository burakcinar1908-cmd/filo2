import { useCallback, useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../src/store/authStore";
import { checkBackendHealth } from "../src/api/health";
import ServerUnavailableScreen from "../src/components/ServerUnavailableScreen";
import { colors } from "../src/theme/colors";

type ServerState = "checking" | "ok" | "down";

export default function RootLayout() {
  const { isLoading, isAuthenticated, role, bootstrap } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [serverState, setServerState] = useState<ServerState>("checking");
  const [serverMessage, setServerMessage] = useState<string | undefined>(undefined);

  const runHealthCheck = useCallback(async (opts?: { keepScreen?: boolean }): Promise<boolean> => {
    // keepScreen: retry'da hata ekranini unmount etme — kendi spinnerini goster
    if (!opts?.keepScreen) setServerState("checking");
    const result = await checkBackendHealth();
    setServerState(result.ok ? "ok" : "down");
    setServerMessage(result.message);
    return result.ok;
  }, []);

  useEffect(() => {
    bootstrap();
    runHealthCheck();
  }, [bootstrap, runHealthCheck]);

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

  // Oturum yüklemesi veya sunucu kontrolü sürerken splash göster
  if (isLoading || serverState === "checking") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Backend'e ulaşılamıyor: uygulama yerine net hata ekranı
  if (serverState === "down") {
    return <ServerUnavailableScreen message={serverMessage} onRetry={() => runHealthCheck({ keepScreen: true })} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

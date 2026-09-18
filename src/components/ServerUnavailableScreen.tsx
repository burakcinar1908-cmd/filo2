import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../theme/colors";

interface Props {
  message?: string;
  onRetry: () => Promise<boolean>;
}

/**
 * Backend'e ulasilamadiginda uygulamanin tam ekranini devralir.
 * "Yeniden Dene" tekrar health check atar; basariliysa uygulama geri doner.
 */
export default function ServerUnavailableScreen({ message, onRetry }: Props) {
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryMessage(null);
    const ok = await onRetry();
    setRetrying(false);
    if (!ok) {
      setRetryMessage("Yine ulaşılamadı. Bağlantını kontrol edip tekrar deneyin.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>Sunucuya ulaşılamıyor</Text>
      <Text style={styles.message}>
        {message ??
          "Tağsimetre sunucusuna şu anda bağlanılamıyor. İnternet bağlantınızı kontrol edin."}
      </Text>
      {retrying ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} />
      ) : (
        <Pressable style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Yeniden Dene</Text>
        </Pressable>
      )}
      {retryMessage && !retrying ? (
        <Text style={styles.retryMessage}>{retryMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  spinner: { height: 48, marginVertical: 28 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  retryMessage: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 16,
    textAlign: "center",
  },
});

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { initSuperAdmin } from "../../src/api/auth";
import { colors, spacing } from "../../src/theme/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg("E-posta ve şifre gereklidir.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await login(email.trim(), password);
    } catch {
      setErrorMsg("E-posta veya şifre hatalı.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoLongPress = () => {
    Alert.alert(
      "Süper Admin Kurulumu",
      "Sistemde süper admin hesabı yoksa oluşturulsun mu? (Zaten varsa hiçbir şey değişmez.)",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kur",
          onPress: async () => {
            try {
              const res = await initSuperAdmin();
              Alert.alert("Tamam", res.message);
            } catch (err) {
              Alert.alert("Hata", err instanceof Error ? err.message : "Kurulum başarısız.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brand}>
            <TouchableOpacity onLongPress={handleLogoLongPress} delayLongPress={2000} activeOpacity={0.8}>
              <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.brandName}>Tagsimetre</Text>
            <Text style={styles.brandSub}>Filo Yönetim Sistemi</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@tagsimetre.com"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.buttonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.registerLink}>
                <Text style={styles.registerLinkText}>Hesabınız yok mu? Kayıt olun</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing(3) },
  brand: { alignItems: "center", marginBottom: spacing(6) },
  logoImage: { width: 120, height: 86, marginBottom: spacing(2) },
  brandName: { color: colors.text, fontSize: 24, fontWeight: "700" },
  brandSub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  form: { gap: spacing(1) },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1), marginTop: spacing(2) },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, marginTop: spacing(1.5), fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing(1.75),
    alignItems: "center",
    marginTop: spacing(3),
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  registerLink: { alignItems: "center", marginTop: spacing(2.5) },
  registerLinkText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { adminForgotPassword, driverForgotPassword } from "../../src/api/auth";

/**
 * Şifremi unuttum — iki akış:
 *  - Admin: e-posta + 9 haneli kurtarma kodu + yeni şifre
 *  - Sürücü: yalnız e-posta; talep adminine bildirim olarak gider
 */
export default function ForgotPasswordScreen() {
  const [mode, setMode] = useState<"choose" | "admin" | "driver">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitAdmin = async () => {
    if (!email || !code || newPassword.length < 6) {
      setError("Tüm alanları doldurun (şifre en az 6 karakter).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminForgotPassword(email.trim(), code.trim(), newPassword);
      setInfo("Şifreniz güncellendi. Giriş yapabilirsiniz.");
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const submitDriver = async () => {
    if (!email) {
      setError("E-posta gereklidir.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await driverForgotPassword(email.trim());
      setInfo(res.message || "Talebiniz admininize iletildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Şifremi Unuttum</Text>

        {mode === "choose" && (
          <>
            <Text style={styles.subtitle}>Hangi hesap türü için şifre sıfırlamak istiyorsunuz?</Text>
            <TouchableOpacity style={styles.choiceButton} onPress={() => setMode("admin")}>
              <Ionicons name="business" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Adminim</Text>
                <Text style={styles.choiceDesc}>Kayıtta verdiğim 9 haneli kurtarma kodum var</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.choiceButton} onPress={() => setMode("driver")}>
              <Ionicons name="person" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Sürücüyüm</Text>
                <Text style={styles.choiceDesc}>Adminime bildirim gitsin, yeni şifreyi o belirlesin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </TouchableOpacity>
          </>
        )}

        {mode === "admin" && (
          <>
            <Text style={styles.label}>E-posta</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="ornek@sirket.com" placeholderTextColor={colors.textDim} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Kurtarma Kodu (9 haneli)</Text>
            <TextInput style={styles.input} value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="XXXXX-XXXX" placeholderTextColor={colors.textDim} autoCapitalize="characters" maxLength={9} />
            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="En az 6 karakter" placeholderTextColor={colors.textDim} secureTextEntry />
            <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={submitAdmin} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Şifreyi Sıfırla</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("choose")} style={styles.switchLink}>
              <Text style={styles.switchText}>Hesap türünü değiştir</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === "driver" && (
          <>
            <Text style={styles.subtitle}>
              E-postanızı girin; admininize şifre sıfırlama talebiniz bildirim olarak düşer. Yeni şifreyi admininiz belirler.
            </Text>
            <Text style={styles.label}>E-posta</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="ornek@tagsimetre.com" placeholderTextColor={colors.textDim} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={submitDriver} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Talep Gönder</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("choose")} style={styles.switchLink}>
              <Text style={styles.switchText}>Hesap türünü değiştir</Text>
            </TouchableOpacity>
          </>
        )}

        {info && <Text style={styles.info}>{info}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing(3) },
  backLink: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginBottom: spacing(2) },
  backText: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: spacing(2) },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing(2.5), lineHeight: 20 },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing(2),
    marginBottom: spacing(1.5),
  },
  choiceTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  choiceDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1), marginTop: spacing(1.5) },
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
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing(1.75), alignItems: "center", marginTop: spacing(3) },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  switchLink: { alignItems: "center", marginTop: spacing(2.5) },
  switchText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  info: { color: colors.success, fontSize: 14, marginTop: spacing(2), textAlign: "center" },
  error: { color: colors.danger, fontSize: 14, marginTop: spacing(2), textAlign: "center" },
});

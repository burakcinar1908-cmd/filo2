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
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { colors, spacing } from "../../src/theme/colors";

export default function RegisterScreen() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!companyName || !contactName || !phone || !email || !password) {
      setErrorMsg("Lütfen tüm alanları doldurun.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg("Şifreler eşleşmiyor.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await register({
        email: email.trim(),
        password,
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        phone: phone.trim(),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.brand}>
            <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>Hesap Oluştur</Text>
            <Text style={styles.brandSub}>Firmanız için Admin hesabı açın</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Firma Adı</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Örn: Tagsimetre Filo A.Ş."
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.label}>Yetkili Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Ad Soyad"
              placeholderTextColor={colors.textDim}
            />

            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="05XX XXX XX XX"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@sirket.com"
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
              placeholder="En az 6 karakter"
              placeholderTextColor={colors.textDim}
              secureTextEntry
            />

            <Text style={styles.label}>Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={colors.textDim}
              secureTextEntry
            />

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
            </TouchableOpacity>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.registerLink}>
                <Text style={styles.registerLinkText}>Zaten hesabınız var mı? Giriş yapın</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing(3), paddingVertical: spacing(4) },
  brand: { alignItems: "center", marginBottom: spacing(4) },
  logoImage: { width: 100, height: 72, marginBottom: spacing(2) },
  brandName: { color: colors.text, fontSize: 22, fontWeight: "700" },
  brandSub: { color: colors.textMuted, fontSize: 14, marginTop: 4, textAlign: "center" },
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

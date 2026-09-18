import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { changePassword, getRecoveryCode } from "../../src/api/auth";
import { downloadShiftsCsv } from "../../src/api/reports";

export default function AdminProfileScreen() {
  const { user, role, logout } = useAuthStore();
  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";

  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPw || newPw.length < 6 || newPw !== newPw2) {
      Alert.alert("Kontrol", "Yeni şifre en az 6 karakter olmalı ve iki kez aynı girilmelidir.");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(currentPw, newPw);
      setPwModal(false);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
      Alert.alert("Tamam", "Şifreniz değiştirildi.");
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Şifre değiştirilemedi.");
    } finally {
      setPwBusy(false);
    }
  };

  const handleShowRecoveryCode = async () => {
    try {
      const res = await getRecoveryCode();
      setRecoveryCode(res.recovery_code);
    } catch {
      Alert.alert("Hata", "Kurtarma kodu alınamadı.");
    }
  };

  const handleDownloadCsv = async () => {
    setCsvBusy(true);
    try {
      await downloadShiftsCsv();
      if (require("react-native").Platform.OS === "web") {
        Alert.alert("Tamam", "Rapor indirildi (tarayıcı indirmelerine bakın).");
      }
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Rapor indirilemedi.");
    } finally {
      setCsvBusy(false);
    }
  };

  const rows: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = isSuperAdmin
    ? [
        { label: "E-posta", value: String(user?.email ?? "—"), icon: "mail-outline" },
        { label: "Rol", value: "Süper Admin", icon: "shield-checkmark-outline" },
      ]
    : [
        { label: "Firma", value: String(user?.company_name ?? "—"), icon: "business-outline" },
        { label: "Yetkili", value: String(user?.contact_name ?? "—"), icon: "person-outline" },
        { label: "E-posta", value: String(user?.email ?? "—"), icon: "mail-outline" },
        { label: "Telefon", value: String(user?.phone ?? "—"), icon: "call-outline" },
        { label: "Rol", value: "Admin", icon: "shield-checkmark-outline" },
      ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(4) }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name={isSuperAdmin ? "shield-checkmark" : "business"} size={36} color={colors.text} />
          </View>
          <Text style={styles.name}>
            {isSuperAdmin ? "Süper Admin" : String(user?.company_name ?? "Admin")}
          </Text>
          <Text style={styles.role}>{isSuperAdmin ? "Platform Yönetimi" : "Firma Yönetimi"}</Text>
        </View>

        <View style={styles.card}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.row, i !== rows.length - 1 && styles.rowBorder]}>
              <Ionicons name={row.icon} size={20} color={colors.textMuted} style={styles.rowIcon} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.actionRow} onPress={() => setPwModal(true)}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Şifre Değiştir</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </TouchableOpacity>

        {isAdmin && (
          <>
            <TouchableOpacity style={styles.actionRow} onPress={handleShowRecoveryCode}>
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Kurtarma Kodumu Göster</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleDownloadCsv} disabled={csvBusy}>
              {csvBusy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={20} color={colors.primary} />
              )}
              <Text style={styles.actionText}>Mesai Raporu İndir (CSV)</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pwModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <Text style={styles.label}>Mevcut Şifre</Text>
            <TextInput style={styles.input} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholderTextColor={colors.textDim} />
            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput style={styles.input} value={newPw} onChangeText={setNewPw} secureTextEntry placeholderTextColor={colors.textDim} />
            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <TextInput style={styles.input} value={newPw2} onChangeText={setNewPw2} secureTextEntry placeholderTextColor={colors.textDim} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPwModal(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleChangePassword} disabled={pwBusy}>
                {pwBusy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.modalConfirmText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!recoveryCode} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kurtarma Kodunuz</Text>
            <Text style={styles.recoveryCode}>{recoveryCode}</Text>
            <Text style={styles.recoveryNote}>
              Şifrenizi unutursanız giriş ekranındaki "Şifremi unuttum" bölümünde kullanılır. Kimseyle paylaşmayın.
            </Text>
            <TouchableOpacity style={styles.modalConfirmFull} onPress={() => setRecoveryCode(null)}>
              <Text style={styles.modalConfirmText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2.5) },
  header: { alignItems: "center", marginVertical: spacing(3) },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 20, fontWeight: "700" },
  role: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: spacing(2) },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { marginRight: spacing(1.5) },
  rowText: { flex: 1 },
  rowLabel: { color: colors.textDim, fontSize: 12 },
  rowValue: { color: colors.text, fontSize: 15, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing(2),
    marginTop: spacing(1.5),
  },
  actionText: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1),
    marginTop: spacing(3),
    paddingVertical: spacing(1.75),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing(3) },
  modalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing(3), borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: spacing(1) },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1), marginTop: spacing(1.5) },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(2.5) },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.surfaceAlt },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary },
  modalConfirmFull: { alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary, marginTop: spacing(2.5) },
  modalConfirmText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  recoveryCode: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: 4, textAlign: "center", marginTop: spacing(1.5) },
  recoveryNote: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: spacing(1.5) },
});

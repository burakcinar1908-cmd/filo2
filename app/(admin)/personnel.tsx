import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { StaggerInView } from "../../src/components/ui/StaggerInView";
import { useAuthStore } from "../../src/store/authStore";
import { getPersonnel, createPersonnel, Personnel } from "../../src/api/fleet";
import { resetPersonnelPassword } from "../../src/api/auth";

export default function PersonnelScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [resetTarget, setResetTarget] = useState<Personnel | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPersonnel();
      setPersonnel(data);
    } catch {
      // sessiz geç
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (resetPassword.length < 6) {
      Alert.alert("Geçersiz şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setResetBusy(true);
    try {
      await resetPersonnelPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
      setResetPassword("");
      Alert.alert("Tamam", `${resetTarget.name} için yeni şifre belirlendi. Sürücüyle paylaşın.`);
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Şifre sıfırlanamadı.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleAdd = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Eksik bilgi", "Lütfen tüm alanları doldurun.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Geçersiz şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setBusy(true);
    try {
      await createPersonnel({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setModalVisible(false);
      resetForm();
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Sürücü eklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sürücüler</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={personnel}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <StaggerInView index={index}>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/(admin)/driver-detail", params: { id: item.id, name: item.name } })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: item.is_active ? colors.success : colors.textDim }]}>
                <Text style={styles.badgeText}>{item.is_active ? "Aktif" : "Pasif"}</Text>
              </View>
            </View>
            <Text style={styles.meta}>{item.email}</Text>
            <Text style={styles.metaDim}>{item.phone}</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setResetTarget(item);
                  setResetPassword("");
                }}
              >
                <Ionicons name="key-outline" size={14} color={colors.warning} />
                <Text style={styles.resetButtonText}>Şifre Sıfırla</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          </StaggerInView>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Kayıtlı sürücü bulunmuyor.</Text>}
      />

      {/* Şifre sıfırlama modalı */}
      <Modal visible={!!resetTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Şifre Sıfırla</Text>
            <Text style={styles.modalSub}>{resetTarget?.name} için yeni şifre belirleyin. Sürücüye bildirim düşer.</Text>
            <Text style={styles.label}>Yeni Şifre</Text>
            <TextInput style={styles.input} value={resetPassword} onChangeText={setResetPassword} placeholder="En az 6 karakter" placeholderTextColor={colors.textDim} secureTextEntry />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setResetTarget(null)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleResetPassword} disabled={resetBusy}>
                {resetBusy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.modalConfirmText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Yeni Sürücü Ekle</Text>

              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ad Soyad"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@tagsimetre.com"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                keyboardType="email-address"
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

              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor={colors.textDim}
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.modalCancelText}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleAdd} disabled={busy}>
                  <Text style={styles.modalConfirmText}>{busy ? "..." : "Ekle"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing(2.5),
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(3) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
    marginBottom: spacing(1.5),
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  badge: { paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: spacing(0.75) },
  metaDim: { color: colors.textDim, fontSize: 12, marginTop: spacing(0.5) },
  resetButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: spacing(1), paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 8, borderWidth: 1, borderColor: colors.warning },
  resetButtonText: { color: colors.warning, fontSize: 12, fontWeight: "600" },
  modalSub: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1.5) },
  empty: { color: colors.textDim, textAlign: "center", marginTop: spacing(4) },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing(3) },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "85%",
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: spacing(2) },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1) },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing(2),
  },
  modalActions: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(1) },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.surfaceAlt },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary },
  modalConfirmText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});

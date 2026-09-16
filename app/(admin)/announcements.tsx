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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { getAnnouncements, createAnnouncement, Announcement } from "../../src/api/announcements";
import { getPersonnel, Personnel } from "../../src/api/fleet";

// Süper Admin -> "admin" hedefleyebilir, Admin -> "personnel" hedefleyebilir.
// target_ids boşsa role'deki HERKESE gider; doluysa sadece seçilenlere gider.

export default function AnnouncementsScreen() {
  const role = useAuthStore((s) => s.role);
  const canSend = role === "admin" || role === "superadmin";
  const targetRole = role === "superadmin" ? "admin" : "personnel";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
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

  const openModal = async () => {
    setModalVisible(true);
    if (role === "admin" && personnelList.length === 0) {
      try {
        const data = await getPersonnel();
        setPersonnelList(data);
      } catch {
        // sessiz geç
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setAudience("all");
    setSelectedIds([]);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    if (!title || !content) {
      Alert.alert("Eksik bilgi", "Başlık ve içerik gerekli.");
      return;
    }
    if (audience === "selected" && selectedIds.length === 0) {
      Alert.alert("Kimse seçilmedi", "Lütfen en az bir alıcı seçin veya 'Herkese' gönderin.");
      return;
    }
    setBusy(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        target_role: targetRole,
        target_ids: audience === "selected" ? selectedIds : undefined,
      });
      setModalVisible(false);
      resetForm();
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Duyuru gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duyurular</Text>
        {canSend && (
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="megaphone" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleString("tr-TR")}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Henüz duyuru bulunmuyor.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Yeni Duyuru</Text>

              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Duyuru başlığı"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.label}>İçerik</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Duyuru metni"
                placeholderTextColor={colors.textDim}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Kime gönderilsin?</Text>
              <View style={styles.audienceRow}>
                <TouchableOpacity
                  style={[styles.audienceChip, audience === "all" && styles.audienceChipActive]}
                  onPress={() => setAudience("all")}
                >
                  <Text style={[styles.audienceChipText, audience === "all" && styles.audienceChipTextActive]}>
                    Herkese
                  </Text>
                </TouchableOpacity>
                {role === "admin" && (
                  <TouchableOpacity
                    style={[styles.audienceChip, audience === "selected" && styles.audienceChipActive]}
                    onPress={() => setAudience("selected")}
                  >
                    <Text
                      style={[styles.audienceChipText, audience === "selected" && styles.audienceChipTextActive]}
                    >
                      Seçilenler
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {audience === "selected" && role === "admin" && (
                <View style={styles.personnelPicker}>
                  {personnelList.length === 0 ? (
                    <Text style={styles.pickerEmpty}>Sürücü bulunamadı.</Text>
                  ) : (
                    personnelList.map((p) => {
                      const checked = selectedIds.includes(p.id);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.personnelRow}
                          onPress={() => toggleSelected(p.id)}
                        >
                          <Ionicons
                            name={checked ? "checkbox" : "square-outline"}
                            size={20}
                            color={checked ? colors.primary : colors.textDim}
                          />
                          <Text style={styles.personnelName}>{p.name}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

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
                <TouchableOpacity style={styles.modalConfirm} onPress={handleSend} disabled={busy}>
                  <Text style={styles.modalConfirmText}>{busy ? "..." : "Gönder"}</Text>
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
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  cardContent: { color: colors.textMuted, fontSize: 14, marginTop: spacing(1), lineHeight: 20 },
  cardDate: { color: colors.textDim, fontSize: 11, marginTop: spacing(1) },
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
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing(2),
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  audienceRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(2) },
  audienceChip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  audienceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  audienceChipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  audienceChipTextActive: { color: colors.onPrimary },
  personnelPicker: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.5),
    marginBottom: spacing(2),
    maxHeight: 200,
  },
  pickerEmpty: { color: colors.textDim, fontSize: 13, textAlign: "center", padding: spacing(2) },
  personnelRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.25), paddingVertical: spacing(1) },
  personnelName: { color: colors.text, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(1) },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(1.5),
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary },
  modalConfirmText: { color: colors.onPrimary, fontSize: 15, fontWeight: "700" },
});

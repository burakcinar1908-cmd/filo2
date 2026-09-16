import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import {
  getPerformance,
  getWarningsForPersonnel,
  createWarning,
  adjustPerformance,
  PerformanceSummary,
  Warning,
} from "../../src/api/extras";

export default function DriverDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();

  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"warning" | "blacklist">("warning");
  const [scoreDelta, setScoreDelta] = useState("");
  const [scoreReason, setScoreReason] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [perf, warns] = await Promise.all([getPerformance(id), getWarningsForPersonnel(id)]);
      setPerformance(perf);
      setWarnings(warns);
    } catch {
      // sessiz geç
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAddWarning = async () => {
    if (!id || !reason) {
      Alert.alert("Eksik bilgi", "Gerekçe girin.");
      return;
    }
    setBusy(true);
    try {
      await createWarning({ personnel_id: id, reason: reason.trim(), severity });
      setWarningModalVisible(false);
      setReason("");
      setSeverity("warning");
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Uyarı eklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustScore = async () => {
    const delta = parseInt(scoreDelta, 10);
    if (!id || Number.isNaN(delta) || !scoreReason) {
      Alert.alert("Eksik bilgi", "Puan ve gerekçe girin.");
      return;
    }
    setBusy(true);
    try {
      await adjustPerformance(id, delta, scoreReason.trim());
      setScoreModalVisible(false);
      setScoreDelta("");
      setScoreReason("");
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Puan güncellenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const scoreColor =
    (performance?.score ?? 100) >= 80
      ? colors.success
      : (performance?.score ?? 100) >= 50
      ? colors.warning
      : colors.danger;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{name ?? "Sürücü"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scoreCard}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{performance?.score ?? "—"}</Text>
          <Text style={styles.scoreLabel}>Performans Puanı</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{performance?.completed_shifts ?? 0}</Text>
            <Text style={styles.statLabel}>Tamamlanan Mesai</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{performance?.warning_count ?? 0}</Text>
            <Text style={styles.statLabel}>Uyarı</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{performance?.blacklist_count ?? 0}</Text>
            <Text style={styles.statLabel}>Kara Liste</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setWarningModalVisible(true)}>
            <Ionicons name="warning-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Uyarı Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setScoreModalVisible(true)}>
            <Ionicons name="stats-chart-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Puan Notu</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Uyarı Geçmişi</Text>
        {warnings.length === 0 ? (
          <Text style={styles.empty}>Kayıt bulunmuyor.</Text>
        ) : (
          warnings.map((w) => (
            <View
              key={w.id}
              style={[styles.warningCard, { borderColor: w.severity === "blacklist" ? colors.danger : colors.warning }]}
            >
              <Text style={styles.warningReason}>{w.reason}</Text>
              <Text style={styles.warningDate}>{new Date(w.created_at).toLocaleString("tr-TR")}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={warningModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Uyarı Ver</Text>

            <View style={styles.severityRow}>
              <TouchableOpacity
                style={[styles.severityChip, severity === "warning" && styles.severityChipWarning]}
                onPress={() => setSeverity("warning")}
              >
                <Text style={styles.severityChipText}>Uyarı</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.severityChip, severity === "blacklist" && styles.severityChipBlacklist]}
                onPress={() => setSeverity("blacklist")}
              >
                <Text style={styles.severityChipText}>Kara Liste</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Gerekçe"
              placeholderTextColor={colors.textDim}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setWarningModalVisible(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddWarning} disabled={busy}>
                <Text style={styles.modalConfirmText}>{busy ? "..." : "Gönder"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={scoreModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Puan Notu Ekle</Text>

            <Text style={styles.label}>Puan (+/-)</Text>
            <TextInput
              style={styles.input}
              value={scoreDelta}
              onChangeText={setScoreDelta}
              placeholder="Örn: -5 veya 10"
              placeholderTextColor={colors.textDim}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Gerekçe</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={scoreReason}
              onChangeText={setScoreReason}
              placeholder="Neden bu puan?"
              placeholderTextColor={colors.textDim}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setScoreModalVisible(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAdjustScore} disabled={busy}>
                <Text style={styles.modalConfirmText}>{busy ? "..." : "Kaydet"}</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(2.5),
    paddingTop: spacing(2),
    paddingBottom: spacing(1.5),
  },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  scroll: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(4) },
  scoreCard: { alignItems: "center", paddingVertical: spacing(3) },
  scoreValue: { fontSize: 48, fontWeight: "800" },
  scoreLabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing(0.5) },
  statsRow: { flexDirection: "row", gap: spacing(1.5), marginBottom: spacing(2.5) },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.75),
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "700" },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2, textAlign: "center" },
  actionsRow: { flexDirection: "row", gap: spacing(1.5), marginBottom: spacing(3) },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(0.75),
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    paddingVertical: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: spacing(1.5) },
  empty: { color: colors.textDim, fontSize: 13 },
  warningCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing(1.5),
    marginBottom: spacing(1),
  },
  warningReason: { color: colors.text, fontSize: 13 },
  warningDate: { color: colors.textDim, fontSize: 11, marginTop: spacing(0.5) },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing(3) },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
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
  textArea: { minHeight: 80, textAlignVertical: "top" },
  severityRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(2) },
  severityChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(1.25),
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityChipWarning: { backgroundColor: colors.warning, borderColor: colors.warning },
  severityChipBlacklist: { backgroundColor: colors.danger, borderColor: colors.danger },
  severityChipText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  modalActions: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(1) },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.surfaceRaised },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary },
  modalConfirmText: { color: colors.onPrimary, fontSize: 15, fontWeight: "700" },
});

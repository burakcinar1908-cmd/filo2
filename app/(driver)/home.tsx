import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { StaggerInView } from "../../src/components/ui/StaggerInView";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { PulseDot } from "../../src/components/ui/PulseDot";
import { useAuthStore } from "../../src/store/authStore";
import { useShiftStore } from "../../src/store/shiftStore";
import { api } from "../../src/api/client";

interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
}

export default function DriverHomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { shift, shiftStatus, gpsStatus, loadActiveShift, startShift, endShift, syncOfflineQueue } =
    useShiftStore();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [kmInput, setKmInput] = useState("");
  const [revenueInput, setRevenueInput] = useState("");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadActiveShift();
      syncOfflineQueue();

      // Mesai aktifken kuyruktaki konumları periyodik olarak backend'e gönder.
      const interval = setInterval(() => {
        if (useShiftStore.getState().shiftStatus === "active") {
          syncOfflineQueue();
        }
      }, 15000);
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    if (shiftStatus === "closed") {
      api.get("/vehicles").then(({ data }) => setVehicles(data)).catch(() => {});
    }
  }, [shiftStatus]);

  const handleStartPress = () => {
    if (vehicles.length === 0) {
      Alert.alert("Araç bulunamadı", "Size tanımlı bir araç bulunmuyor.");
      return;
    }
    setSelectedVehicleId(vehicles[0].id);
    setKmInput("");
    setStartModalVisible(true);
  };

  const confirmStart = async () => {
    if (!selectedVehicleId || !kmInput) {
      Alert.alert("Eksik bilgi", "Lütfen mevcut kilometreyi girin.");
      return;
    }
    setBusy(true);
    try {
      await startShift(selectedVehicleId, parseInt(kmInput, 10));
      setStartModalVisible(false);
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Mesai başlatılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const handleEndPress = () => {
    setKmInput("");
    setRevenueInput("");
    setEndModalVisible(true);
  };

  const confirmEnd = async () => {
    if (!kmInput || !revenueInput) {
      Alert.alert("Eksik bilgi", "Lütfen bitiş kilometresi ve hasılatı girin.");
      return;
    }
    setBusy(true);
    try {
      await endShift(parseInt(kmInput, 10), parseFloat(revenueInput));
      setEndModalVisible(false);
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Mesai bitirilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const activeVehicle = vehicles.find((v) => v.id === shift?.vehicle_id);

  const gpsLabel =
    gpsStatus === "active"
      ? "GPS Aktif"
      : gpsStatus === "permission_required"
      ? "Konum İzni Gerekli"
      : gpsStatus === "syncing"
      ? "Senkronize Ediliyor"
      : "GPS Kapalı";

  const gpsColor =
    gpsStatus === "active" ? colors.success : gpsStatus === "permission_required" ? colors.warning : colors.textDim;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba, {String(user?.name ?? "Sürücü")}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push("/(driver)/notifications")} style={styles.bellButton}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logout}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>

        <StaggerInView index={0}>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Mesai Durumu</Text>
            <View style={[styles.badge, { backgroundColor: shiftStatus === "active" ? colors.success : colors.surfaceAlt }]}>
              {shiftStatus === "active" && <PulseDot size={7} color={colors.text} />}
              <Text style={styles.badgeText}>{shiftStatus === "active" ? "Mesai Aktif" : "Mesai Kapalı"}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>GPS Durumu</Text>
            <View style={[styles.badge, { backgroundColor: gpsColor }]}>
              <Text style={styles.badgeText}>{gpsLabel}</Text>
            </View>
          </View>

          {shift && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Bağlı Araç</Text>
              <Text style={styles.statusValue}>
                {activeVehicle ? `${activeVehicle.plate_number}` : "—"}
              </Text>
            </View>
          )}
        </View>
        </StaggerInView>

        {shiftStatus === "closed" ? (
          <StaggerInView index={1}>
          <PressableScale style={styles.startButton} onPress={handleStartPress}>
            <Text style={styles.startButtonText}>MESAİYİ BAŞLAT</Text>
          </PressableScale>
          </StaggerInView>
        ) : (
          <StaggerInView index={1}>
          <PressableScale style={styles.endButton} onPress={handleEndPress}>
            <Text style={styles.startButtonText}>MESAİYİ BİTİR</Text>
          </PressableScale>
          </StaggerInView>
        )}
      </ScrollView>

      {/* Mesai başlatma modalı */}
      <Modal visible={startModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mesai Başlat</Text>
            <Text style={styles.label}>Araç</Text>
            <View style={styles.vehiclePicker}>
              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.vehicleOption,
                    selectedVehicleId === v.id && styles.vehicleOptionSelected,
                  ]}
                  onPress={() => setSelectedVehicleId(v.id)}
                >
                  <Text style={styles.vehicleOptionText}>{v.plate_number}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Mevcut Kilometre</Text>
            <TextInput
              style={styles.input}
              value={kmInput}
              onChangeText={setKmInput}
              keyboardType="number-pad"
              placeholder="Örn: 125430"
              placeholderTextColor={colors.textDim}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStartModalVisible(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmStart} disabled={busy}>
                <Text style={styles.startButtonText}>{busy ? "..." : "Başlat"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mesai bitirme modalı */}
      <Modal visible={endModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mesai Bitir</Text>
            <Text style={styles.label}>Bitiş Kilometresi</Text>
            <TextInput
              style={styles.input}
              value={kmInput}
              onChangeText={setKmInput}
              keyboardType="number-pad"
              placeholder="Örn: 125610"
              placeholderTextColor={colors.textDim}
            />
            <Text style={styles.label}>Hasılat (₺)</Text>
            <TextInput
              style={styles.input}
              value={revenueInput}
              onChangeText={setRevenueInput}
              keyboardType="decimal-pad"
              placeholder="Örn: 850"
              placeholderTextColor={colors.textDim}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEndModalVisible(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmDanger} onPress={confirmEnd} disabled={busy}>
                <Text style={styles.startButtonText}>{busy ? "..." : "Bitir"}</Text>
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
  scroll: { padding: spacing(2.5) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing(3) },
  greeting: { color: colors.text, fontSize: 20, fontWeight: "700" },
  logout: { color: colors.textMuted, fontSize: 14 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusLabel: { color: colors.textMuted, fontSize: 14 },
  statusValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.75), borderRadius: 999 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  startButton: { backgroundColor: colors.success, borderRadius: 16, paddingVertical: spacing(2.5), alignItems: "center" },
  endButton: { backgroundColor: colors.danger, borderRadius: 16, paddingVertical: spacing(2.5), alignItems: "center" },
  startButtonText: { color: colors.text, fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing(3) },
  modalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing(3), borderWidth: 1, borderColor: colors.border },
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
  vehiclePicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginBottom: spacing(2) },
  vehicleOption: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  vehicleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDark },
  vehicleOptionText: { color: colors.text, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(1) },
  modalCancel: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.surfaceAlt },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalConfirm: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.primary },
  modalConfirmDanger: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, backgroundColor: colors.danger },
});

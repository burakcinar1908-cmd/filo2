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
import { StaggerInView } from "../../src/components/ui/StaggerInView";
import { useAuthStore } from "../../src/store/authStore";
import { getVehicles, createVehicle, Vehicle } from "../../src/api/fleet";

export default function VehiclesScreen() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuel, setFuel] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
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
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setFuel("");
  };

  const handleAdd = async () => {
    if (!plate || !brand || !model || !year || !fuel) {
      Alert.alert("Eksik bilgi", "Lütfen tüm alanları doldurun.");
      return;
    }
    setBusy(true);
    try {
      await createVehicle({
        plate_number: plate.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        fuel_consumption_per_100km: parseFloat(fuel),
      });
      setModalVisible(false);
      resetForm();
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Araç eklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Araçlar</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <StaggerInView index={index}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.plate}>{item.plate_number}</Text>
              <View style={[styles.badge, { backgroundColor: item.is_active ? colors.success : colors.textDim }]}>
                <Text style={styles.badgeText}>{item.is_active ? "Aktif" : "Pasif"}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {item.brand} {item.model} · {item.year}
            </Text>
            <Text style={styles.metaDim}>Ort. Yakıt: {item.fuel_consumption_per_100km} L/100km</Text>
          </View>
          </StaggerInView>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Kayıtlı araç bulunmuyor.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Yeni Araç Ekle</Text>

              <Text style={styles.label}>Plaka</Text>
              <TextInput
                style={styles.input}
                value={plate}
                onChangeText={setPlate}
                placeholder="34 ABC 123"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Marka</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="Örn: Fiat"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="Örn: Egea"
                placeholderTextColor={colors.textDim}
              />

              <Text style={styles.label}>Yıl</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="Örn: 2022"
                placeholderTextColor={colors.textDim}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Ortalama Yakıt Tüketimi (L/100km)</Text>
              <TextInput
                style={styles.input}
                value={fuel}
                onChangeText={setFuel}
                placeholder="Örn: 6.5"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
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
  plate: { color: colors.text, fontSize: 16, fontWeight: "700" },
  badge: { paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: spacing(0.75) },
  metaDim: { color: colors.textDim, fontSize: 12, marginTop: spacing(0.5) },
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

import { useCallback, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { api } from "../../src/api/client";

interface FleetVehicle {
  vehicle_id: string;
  plate_number: string;
  gps_active: boolean;
  last_latitude: number | null;
  last_longitude: number | null;
  driver_name: string | null;
  shift_active: boolean;
}

const DEFAULT_REGION = {
  // Türkiye geneli varsayılan görünüm
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function FleetMapScreen() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [selected, setSelected] = useState<FleetVehicle | null>(null);
  const mapRef = useRef<MapView>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/fleet/live");
      setVehicles(data);
    } catch {
      // sessiz geç
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, 8000);
      return () => clearInterval(interval);
    }, [load])
  );

  const activeVehicles = vehicles.filter((v) => v.last_latitude != null && v.last_longitude != null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Canlı Harita</Text>
        <Text style={styles.subtitle}>{activeVehicles.length} araç konumu görüntüleniyor</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
      >
        {activeVehicles.map((v) => (
          <Marker
            key={v.vehicle_id}
            coordinate={{ latitude: v.last_latitude as number, longitude: v.last_longitude as number }}
            onPress={() => setSelected(v)}
          >
            <View style={[styles.markerPin, { backgroundColor: v.gps_active ? colors.success : colors.textDim }]}>
              <Ionicons name="car-sport" size={16} color={colors.text} />
            </View>
          </Marker>
        ))}
      </MapView>

      {activeVehicles.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>Henüz konum verisi bulunan araç yok</Text>
        </View>
      )}

      {selected && (
        <TouchableOpacity style={styles.infoCard} onPress={() => setSelected(null)} activeOpacity={0.9}>
          <View style={styles.infoRow}>
            <Text style={styles.infoPlate}>{selected.plate_number}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: selected.gps_active ? colors.success : colors.textDim },
              ]}
            >
              <Text style={styles.badgeText}>{selected.gps_active ? "GPS Aktif" : "GPS Kapalı"}</Text>
            </View>
          </View>
          <Text style={styles.infoDriver}>{selected.driver_name ?? "Sürücü atanmadı"}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(2.5), paddingTop: spacing(2), paddingBottom: spacing(1) },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  map: { flex: 1 },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.text,
  },
  emptyOverlay: {
    position: "absolute",
    top: "45%",
    left: spacing(3),
    right: spacing(3),
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 10,
    overflow: "hidden",
  },
  infoCard: {
    position: "absolute",
    bottom: spacing(2.5),
    left: spacing(2.5),
    right: spacing(2.5),
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoPlate: { color: colors.text, fontSize: 16, fontWeight: "700" },
  badge: { paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  infoDriver: { color: colors.textMuted, fontSize: 14, marginTop: spacing(0.75) },
});

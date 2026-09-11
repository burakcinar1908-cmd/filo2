import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { getAdminDashboard, AdminDashboard } from "../../src/api/fleet";
import { api } from "../../src/api/client";

interface FleetVehicle {
  vehicle_id: string;
  shift_active: boolean;
}

export default function AdminHomeScreen() {
  const { user, role } = useAuthStore();
  const isSuperAdmin = role === "superadmin";

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [fleetCount, setFleetCount] = useState<{ total: number; active: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const { data } = await api.get<FleetVehicle[]>("/fleet/live");
        setFleetCount({ total: data.length, active: data.filter((v) => v.shift_active).length });
      } else {
        const data = await getAdminDashboard();
        setDashboard(data);
      }
    } catch {
      // sessiz geç
    }
  }, [isSuperAdmin]);

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

  const licenseLabel =
    dashboard?.license_status === "active"
      ? "Lisans Aktif"
      : dashboard?.license_status === "trial"
      ? "Deneme Sürümü"
      : "Lisans Sona Erdi";
  const licenseColor =
    dashboard?.license_status === "active"
      ? colors.success
      : dashboard?.license_status === "trial"
      ? colors.warning
      : colors.danger;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{isSuperAdmin ? "Süper Admin" : "Merhaba"}</Text>
          <Text style={styles.sub}>
            {isSuperAdmin ? "Platform Genel Bakış" : String(user?.company_name ?? user?.email ?? "")}
          </Text>
        </View>

        {isSuperAdmin ? (
          <View style={styles.statsRow}>
            <StatCard icon="car-sport" label="Toplam Araç" value={fleetCount?.total ?? "—"} />
            <StatCard icon="pulse" label="Mesaide" value={fleetCount?.active ?? "—"} accent={colors.success} />
          </View>
        ) : (
          <>
            <View style={[styles.licenseCard, { borderColor: licenseColor }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={licenseColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.licenseLabel, { color: licenseColor }]}>{licenseLabel}</Text>
                {dashboard?.license_end_date && (
                  <Text style={styles.licenseDate}>
                    Bitiş: {new Date(dashboard.license_end_date).toLocaleDateString("tr-TR")}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                icon="car-sport"
                label="Araçlar"
                value={`${dashboard?.active_vehicles ?? 0}/${dashboard?.total_vehicles ?? 0}`}
              />
              <StatCard
                icon="people"
                label="Sürücüler"
                value={`${dashboard?.active_personnel ?? 0}/${dashboard?.total_personnel ?? 0}`}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard icon="pulse" label="Açık Mesai" value={dashboard?.open_shifts ?? 0} accent={colors.success} />
              <StatCard
                icon="cash-outline"
                label="Toplam Hasılat"
                value={`₺${(dashboard?.total_revenue ?? 0).toLocaleString("tr-TR")}`}
              />
            </View>

            <View style={styles.limitCard}>
              <Text style={styles.limitTitle}>Kullanım Limitleri</Text>
              <View style={styles.limitRow}>
                <Text style={styles.limitLabel}>Araç Limiti</Text>
                <Text style={styles.limitValue}>
                  {dashboard?.total_vehicles ?? 0} / {dashboard?.max_vehicles ?? 0}
                </Text>
              </View>
              <View style={styles.limitRow}>
                <Text style={styles.limitLabel}>Sürücü Limiti</Text>
                <Text style={styles.limitValue}>
                  {dashboard?.total_personnel ?? 0} / {dashboard?.max_personnel ?? 0}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={accent ?? colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing(2.5) },
  header: { marginBottom: spacing(2.5) },
  greeting: { color: colors.text, fontSize: 20, fontWeight: "700" },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  licenseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  licenseLabel: { fontSize: 15, fontWeight: "700" },
  licenseDate: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing(1.5), marginBottom: spacing(1.5) },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: spacing(1) },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
    marginTop: spacing(1),
  },
  limitTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: spacing(1.5) },
  limitRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing(1) },
  limitLabel: { color: colors.textMuted, fontSize: 14 },
  limitValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
});

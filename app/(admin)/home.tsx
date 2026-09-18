import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { getAdminDashboard, getWeeklySummary, AdminDashboard, WeeklySummary } from "../../src/api/fleet";
import { api } from "../../src/api/client";

interface FleetVehicle {
  vehicle_id: string;
  shift_active: boolean;
}

export default function AdminHomeScreen() {
  const { user, role } = useAuthStore();
  const router = useRouter();
  const isSuperAdmin = role === "superadmin";

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [fleetCount, setFleetCount] = useState<{ total: number; active: number } | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const { data } = await api.get<FleetVehicle[]>("/fleet/live");
        setFleetCount({ total: data.length, active: data.filter((v) => v.shift_active).length });
      } else {
        const data = await getAdminDashboard();
        setDashboard(data);
        getWeeklySummary().then(setWeekly).catch(() => setWeekly(null));
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
  const days = dashboard?.days_remaining ?? null;
  const daysText =
    days === null
      ? null
      : dashboard?.license_status === "trial"
      ? days > 0
        ? `Deneme · ${days} gün kaldı`
        : "Deneme süresi doldu"
      : days > 0
      ? `${days} gün sonra bitiyor`
      : "Bugün sona eriyor";
  const licenseUrgent = days !== null && days <= 7;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{isSuperAdmin ? "Süper Admin" : "Merhaba"}</Text>
            <Text style={styles.sub}>
              {isSuperAdmin ? "Platform Genel Bakış" : String(user?.company_name ?? user?.email ?? "")}
            </Text>
          </View>
          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={styles.announcementButton}
              onPress={() => router.push("/(admin)/notifications")}
            >
              <Ionicons name="notifications" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.announcementButton}
              onPress={() => router.push("/(admin)/announcements")}
            >
              <Ionicons name="megaphone" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {isSuperAdmin ? (
          <>
            <TouchableOpacity style={styles.manageButton} onPress={() => router.push("/(admin)/manage")}>
              <Ionicons name="settings-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.manageButtonText}>Firma ve Lisans Yönetimi</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.onPrimary} />
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <StatCard icon="car-sport" label="Toplam Araç" value={fleetCount?.total ?? "—"} />
              <StatCard icon="pulse" label="Mesaide" value={fleetCount?.active ?? "—"} accent={colors.success} />
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.licenseCard, { borderColor: licenseUrgent ? colors.danger : licenseColor }]}
              activeOpacity={0.8}
              onPress={() => router.push("/(admin)/plans")}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={licenseColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.licenseLabel, { color: licenseColor }]}>{licenseLabel}</Text>
                {daysText && <Text style={[styles.licenseDate, licenseUrgent && { color: colors.danger }]}>{daysText}</Text>}
                {!daysText && dashboard?.license_end_date && (
                  <Text style={styles.licenseDate}>
                    Bitiş: {new Date(dashboard.license_end_date).toLocaleDateString("tr-TR")}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </TouchableOpacity>

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

            {weekly && (weekly.top_profit_driver || weekly.top_shifts_driver) && (
              <View style={styles.limitCard}>
                <Text style={styles.limitTitle}>Bu Haftanın Yıldızları</Text>
                {weekly.top_profit_driver && (
                  <View style={styles.starRow}>
                    <Ionicons name="cash-outline" size={16} color={colors.success} />
                    <Text style={styles.starText} numberOfLines={1}>
                      En çok kâr: <Text style={styles.starName}>{weekly.top_profit_driver.name}</Text> · ₺{weekly.top_profit_driver.net_profit.toLocaleString("tr-TR")}
                    </Text>
                  </View>
                )}
                {weekly.top_shifts_driver && (
                  <View style={styles.starRow}>
                    <Ionicons name="pulse" size={16} color={colors.primary} />
                    <Text style={styles.starText} numberOfLines={1}>
                      En çok mesai: <Text style={styles.starName}>{weekly.top_shifts_driver.name}</Text> · {weekly.top_shifts_driver.shifts} mesai
                    </Text>
                  </View>
                )}
              </View>
            )}

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
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing(2.5) },
  headerActionsRow: { flexDirection: "row", gap: spacing(1) },
  announcementButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
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
  starRow: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginBottom: spacing(1) },
  starText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  starName: { color: colors.text, fontWeight: "700" },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  manageButtonText: { color: colors.onPrimary, fontSize: 15, fontWeight: "700", flex: 1 },
  limitRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing(1) },
  limitLabel: { color: colors.textMuted, fontSize: 14 },
  limitValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
});

import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";

export default function AdminProfileScreen() {
  const { user, role, logout } = useAuthStore();
  const isSuperAdmin = role === "superadmin";

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logout },
    ]);
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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
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
});

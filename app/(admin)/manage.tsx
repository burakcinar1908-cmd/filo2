import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import {
  getAdmins,
  toggleAdmin,
  deleteAdmin,
  addLicense,
  updateLimits,
  getPayments,
  getLicensePrices,
  updateLicensePrices,
  getPlatformStats,
  announceToAll,
  SuperAdminListItem,
  AdminPayment,
  LicensePrices,
  PlatformStats,
} from "../../src/api/superadmin";

/** Süper admin: tüm firmalar + tüm ödemeler. Her şeyi gözetler ve düzenler. */
export default function ManageScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"companies" | "payments" | "prices">("companies");
  const [admins, setAdmins] = useState<SuperAdminListItem[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [limitModal, setLimitModal] = useState<SuperAdminListItem | null>(null);
  const [maxVehicles, setMaxVehicles] = useState("");
  const [maxPersonnel, setMaxPersonnel] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [prices, setPrices] = useState<LicensePrices | null>(null);
  const [announceModal, setAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, p, s, pr] = await Promise.all([
        getAdmins(),
        getPayments().catch(() => []),
        getPlatformStats().catch(() => null),
        getLicensePrices().catch(() => null),
      ]);
      setAdmins(a);
      setPayments(p);
      setStats(s);
      setPrices(pr);
    } catch {
      // sessiz
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

  const licenseDaysLeft = (a: SuperAdminListItem): number | null => {
    try {
      const now = Date.now();
      const lic = a.license_end_date ? new Date(a.license_end_date).getTime() : null;
      if (lic && lic > now) return Math.ceil((lic - now) / 86400000);
      const trial = new Date(a.trial_end_date).getTime();
      if (trial > now) return Math.ceil((trial - now) / 86400000);
      return 0;
    } catch {
      return null;
    }
  };

  const handleToggle = (a: SuperAdminListItem) => {
    Alert.alert(
      a.is_active ? "Firmayı Pasifleştir" : "Firmayı Aktifleştir",
      `${a.company_name} — ${a.is_active ? "girişleri kapatılacak" : "tekrar erişim açılacak"}. Devam?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Onayla",
          style: a.is_active ? "destructive" : "default",
          onPress: async () => {
            try {
              await toggleAdmin(a.id, !a.is_active);
              await load();
            } catch (err) {
              Alert.alert("Hata", err instanceof Error ? err.message : "İşlem başarısız");
            }
          },
        },
      ]
    );
  };

  const handleDelete = (a: SuperAdminListItem) => {
    Alert.alert(
      "Firmayı Sil",
      `${a.company_name} ve TÜM verileri (araç, sürücü, mesai) kalıcı silinecek. Bu işlem geri alınamaz!`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kalıcı Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdmin(a.id);
              await load();
            } catch (err) {
              Alert.alert("Hata", err instanceof Error ? err.message : "Silme başarısız");
            }
          },
        },
      ]
    );
  };

  const handleAddLicense = (a: SuperAdminListItem, months: number) => {
    setBusy(true);
    addLicense(a.id, months)
      .then(load)
      .catch((err) => Alert.alert("Hata", err instanceof Error ? err.message : "Lisans eklenemedi"))
      .finally(() => setBusy(false));
  };

  const openLimits = (a: SuperAdminListItem) => {
    setLimitModal(a);
    setMaxVehicles(String(a.max_vehicles));
    setMaxPersonnel(String(a.max_personnel));
  };

  const handleSavePrices = async () => {
    if (!prices) return;
    setBusy(true);
    try {
      await updateLicensePrices(prices);
      Alert.alert("Tamam", "Fiyatlar güncellendi.");
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Fiyatlar güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  const handleAnnounce = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert("Eksik bilgi", "Başlık ve içerik gereklidir.");
      return;
    }
    setBusy(true);
    try {
      await announceToAll(annTitle.trim(), annBody.trim());
      setAnnounceModal(false);
      setAnnTitle("");
      setAnnBody("");
      Alert.alert("Tamam", "Duyuru tüm kullanıcılara gönderildi.");
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Duyuru gönderilemedi");
    } finally {
      setBusy(false);
    }
  };

  const saveLimits = async () => {
    if (!limitModal) return;
    const v = parseInt(maxVehicles, 10);
    const p = parseInt(maxPersonnel, 10);
    if (Number.isNaN(v) || Number.isNaN(p) || v < 0 || p < 0) {
      Alert.alert("Geçersiz değer", "Limitler sıfır veya pozitif sayı olmalı.");
      return;
    }
    setBusy(true);
    try {
      await updateLimits(limitModal.id, v, p);
      setLimitModal(null);
      await load();
    } catch (err) {
      Alert.alert("Hata", err instanceof Error ? err.message : "Limitler güncellenemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Platform Yönetimi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.announceButton} onPress={() => setAnnounceModal(true)}>
          <Ionicons name="megaphone" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabButton, tab === "companies" && styles.tabActive]} onPress={() => setTab("companies")}>
          <Text style={[styles.tabText, tab === "companies" && styles.tabTextActive]}>Firmalar ({admins.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, tab === "payments" && styles.tabActive]} onPress={() => setTab("payments")}>
          <Text style={[styles.tabText, tab === "payments" && styles.tabTextActive]}>Ödemeler ({payments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, tab === "prices" && styles.tabActive]} onPress={() => setTab("prices")}>
          <Text style={[styles.tabText, tab === "prices" && styles.tabTextActive]}>Fiyatlar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === "prices" && prices && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lisans Paket Fiyatları</Text>
            <Text style={styles.modalSub}>Paketler ekranında adminlere gösterilecek fiyatlar.</Text>
            {([
              ["month_1", "1 Aylık"],
              ["month_3", "3 Aylık"],
              ["month_6", "6 Aylık"],
              ["month_12", "12 Aylık"],
            ] as const).map(([key, label]) => (
              <View key={key} style={styles.priceRow}>
                <Text style={styles.priceLabel}>{label}</Text>
                <TextInput
                  style={styles.priceInput}
                  value={prices[key]}
                  onChangeText={(t) => setPrices({ ...prices, [key]: t })}
                  placeholder="₺299"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.savePricesButton} onPress={handleSavePrices} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.modalConfirmText}>Fiyatları Kaydet</Text>}
            </TouchableOpacity>
          </View>
        )}

        {tab === "companies" && stats && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Platform Özeti</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{stats.total_admins}</Text>
                <Text style={styles.statLabel}>Firma</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.success }]}>{stats.active_admins}</Text>
                <Text style={styles.statLabel}>Lisanslı</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.warning }]}>{stats.trial_admins}</Text>
                <Text style={styles.statLabel}>Deneme</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.danger }]}>{stats.expired_admins}</Text>
                <Text style={styles.statLabel}>Süresi Bitmiş</Text>
              </View>
            </View>
          </View>
        )}

        {tab === "companies" &&
          admins.map((a) => {
            const days = licenseDaysLeft(a);
            const expired = days !== null && days <= 0;
            return (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.company}>{a.company_name || a.email}</Text>
                    <Text style={styles.meta}>{a.email}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: a.is_active ? colors.success : colors.textDim }]}>
                    <Text style={styles.badgeText}>{a.is_active ? "Aktif" : "Pasif"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={expired ? colors.danger : colors.warning} />
                  <Text style={[styles.infoText, expired && { color: colors.danger }]}>
                    {expired ? "Lisans/Deneme bitti" : `${days} gün kaldı`}
                    {a.license_end_date && a.license_end_date > new Date().toISOString() ? " (Lisans)" : " (Deneme)"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="car-sport-outline" size={15} color={colors.textDim} />
                  <Text style={styles.infoText}>Araç limiti: {a.max_vehicles}</Text>
                  <Ionicons name="people-outline" size={15} color={colors.textDim} style={{ marginLeft: spacing(1.5) }} />
                  <Text style={styles.infoText}>Sürücü limiti: {a.max_personnel}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleAddLicense(a, 1)} disabled={busy}>
                    <Text style={styles.actionText}>+1 Ay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleAddLicense(a, 12)} disabled={busy}>
                    <Text style={styles.actionText}>+12 Ay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openLimits(a)}>
                    <Text style={styles.actionText}>Limitler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionWarn]} onPress={() => handleToggle(a)}>
                    <Text style={[styles.actionText, styles.actionWarnText]}>{a.is_active ? "Pasifleştir" : "Aktifleştir"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionDanger]} onPress={() => handleDelete(a)}>
                    <Text style={[styles.actionText, styles.actionDangerText]}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {tab === "payments" && (
          <>
            {payments.length === 0 && <Text style={styles.empty}>Henüz ödeme kaydı yok.</Text>}
            {payments.map((p) => (
              <View key={p.merchant_oid} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.company}>{p.company_name}</Text>
                    <Text style={styles.meta}>
                      {p.provider} · {p.months} ay · {(p.amount_kurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: p.status === "completed" ? colors.success : p.status === "failed" ? colors.danger : colors.warning }]}>
                    <Text style={styles.badgeText}>{p.status === "completed" ? "Tamamlandı" : p.status === "failed" ? "Başarısız" : "Bekliyor"}</Text>
                  </View>
                </View>
                <Text style={styles.metaDim}>
                  {p.created_at ? new Date(p.created_at).toLocaleString("tr-TR") : ""}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Herkese duyuru modalı */}
      <Modal visible={announceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Herkese Duyuru</Text>
            <Text style={styles.modalSub}>Tüm adminlere ve sürücülere bildirim olarak düşer.</Text>
            <Text style={styles.label}>Başlık</Text>
            <TextInput style={styles.input} value={annTitle} onChangeText={setAnnTitle} placeholder="Örn: Yeni özellik yayında!" placeholderTextColor={colors.textDim} />
            <Text style={styles.label}>İçerik</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} value={annBody} onChangeText={setAnnBody} placeholder="Duyuru metni..." placeholderTextColor={colors.textDim} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAnnounceModal(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAnnounce} disabled={busy}>
                {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.modalConfirmText}>Gönder</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!limitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Limitleri Düzenle</Text>
            <Text style={styles.modalSub}>{limitModal?.company_name}</Text>
            <Text style={styles.label}>Araç Limiti</Text>
            <TextInput style={styles.input} value={maxVehicles} onChangeText={setMaxVehicles} keyboardType="number-pad" placeholderTextColor={colors.textDim} />
            <Text style={styles.label}>Sürücü Limiti</Text>
            <TextInput style={styles.input} value={maxPersonnel} onChangeText={setMaxPersonnel} keyboardType="number-pad" placeholderTextColor={colors.textDim} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setLimitModal(null)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={saveLimits} disabled={busy}>
                {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.modalConfirmText}>Kaydet</Text>}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing(2.5), paddingTop: spacing(1) },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: spacing(1.5), padding: spacing(2.5), paddingBottom: spacing(1) },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: spacing(1.25), borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  tabActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  headerRight: { position: "absolute", right: spacing(2.5), top: spacing(1.5) },
  announceButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing(1) },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginTop: spacing(1.5) },
  priceLabel: { color: colors.textMuted, fontSize: 14, flex: 1 },
  priceInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.25),
    color: colors.text,
    fontSize: 16,
    width: 120,
    textAlign: "right",
  },
  savePricesButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing(1.5), alignItems: "center", marginTop: spacing(2.5) },
  statsGrid: { flexDirection: "row", gap: spacing(1), marginTop: spacing(1) },
  statBox: { flex: 1, alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingVertical: spacing(1.5) },
  statNum: { color: colors.text, fontSize: 20, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: colors.text },
  list: { padding: spacing(2.5), paddingBottom: spacing(5) },
  card: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: spacing(2), marginBottom: spacing(1.5) },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  company: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  metaDim: { color: colors.textDim, fontSize: 11, marginTop: spacing(0.5) },
  badge: { paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(1) },
  infoText: { color: colors.textMuted, fontSize: 12.5 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginTop: spacing(1.5) },
  actionButton: { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.75), borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  actionWarn: { borderColor: colors.warning },
  actionWarnText: { color: colors.warning },
  actionDanger: { borderColor: colors.danger },
  actionDangerText: { color: colors.danger },
  empty: { color: colors.textDim, textAlign: "center", marginTop: spacing(4) },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing(3) },
  modalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing(3), borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  modalSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1), marginTop: spacing(2) },
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
  modalConfirmText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});

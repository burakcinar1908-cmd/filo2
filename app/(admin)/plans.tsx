import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { StaggerInView } from "../../src/components/ui/StaggerInView";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { getLicensePrices, initPayment, LicensePrices } from "../../src/api/payments";

const PLANS = [
  { months: 1 as const, key: "month_1" as const, name: "1 Ay", tag: null },
  { months: 3 as const, key: "month_3" as const, name: "3 Ay", tag: "%11 indirim" },
  { months: 6 as const, key: "month_6" as const, name: "6 Ay", tag: "%17 indirim" },
  { months: 12 as const, key: "month_12" as const, name: "12 Ay", tag: "En avantajlı" },
];

export default function PlansScreen() {
  const router = useRouter();
  const [prices, setPrices] = useState<LicensePrices | null>(null);
  const [selected, setSelected] = useState<(typeof PLANS)[number] | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [provider, setProvider] = useState<"paytr" | "iyzico">("iyzico");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threeDs, setThreeDs] = useState<{ html: string; oid: string } | null>(null);
  const [payResult, setPayResult] = useState<"success" | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLicensePrices()
        .then(setPrices)
        .catch(() => setError("Fiyatlar alınamadı. Bağlantınızı kontrol edin."));
    }, [])
  );

  const openCheckout = (plan: (typeof PLANS)[number]) => {
    setPayResult(null);
    setSelected((prev) => (prev?.months === plan.months && !cardName ? null : plan));
    setError(null);
  };

  const handlePay = async () => {
    if (!selected) return;
    const digits = cardNumber.replace(/\D/g, "");
    const mmYY = expiry.match(/^(\d{2})\s*\/?\s*(\d{2})$/);
    if (!cardName.trim() || digits.length < 15 || !mmYY || cvv.length < 3) {
      setError("Kart bilgilerini kontrol edin.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await initPayment(provider, selected.months, {
        card_holder_name: cardName.trim(),
        card_number: digits,
        expiry_month: mmYY[1],
        expiry_year: mmYY[2],
        cvv,
      });
      if (res.status === "redirect_required" && res.html_content) {
        setThreeDs({ html: res.html_content, oid: res.merchant_oid });
      } else if (res.status === "failed") {
        setError(res.message || "Ödeme başlatılamadı.");
      } else {
        setSelected(null);
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödeme başlatılamadı.");
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
        <Text style={styles.title}>Paketler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
          Filo limitlerinizi ve lisansınızı uzatmak için bir paket seçin.
        </Text>

        {!prices && !error && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(4) }} />}
        {error && !selected && <Text style={styles.error}>{error}</Text>}

        <View style={styles.planGrid}>
          {PLANS.map((plan, i) => (
            <StaggerInView key={plan.months} index={i}>
            <PressableScale
              style={[styles.planCard, selected?.months === plan.months && styles.planSelected]}
              onPress={() => openCheckout(plan)}
            >
              {plan.tag && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{plan.tag}</Text>
                </View>
              )}
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{prices ? prices[plan.key] : "..."}</Text>
            </PressableScale>
            </StaggerInView>
          ))}
        </View>

        {selected && (
          <View style={styles.checkoutCard}>
            <Text style={styles.checkoutTitle}>{selected.name} Lisans — {prices ? prices[selected.key] : ""}</Text>

            <Text style={styles.label}>Kart Üzerindeki İsim</Text>
            <TextInput style={styles.input} value={cardName} onChangeText={setCardName} placeholder="AD SOYAD" placeholderTextColor={colors.textDim} autoCapitalize="characters" />

            <Text style={styles.label}>Kart Numarası</Text>
            <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} placeholder="0000 0000 0000 0000" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={19} />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Son Kullanma (AA/YY)</Text>
                <TextInput style={styles.input} value={expiry} onChangeText={setExpiry} placeholder="12/26" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CVV</Text>
                <TextInput style={styles.input} value={cvv} onChangeText={setCvv} placeholder="000" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={4} secureTextEntry />
              </View>
            </View>

            <Text style={styles.label}>Ödeme Sağlayıcısı</Text>
            <View style={styles.providerRow}>
              <TouchableOpacity style={[styles.providerButton, provider === "iyzico" && styles.providerSelected]} onPress={() => setProvider("iyzico")}>
                <Text style={[styles.providerText, provider === "iyzico" && styles.providerTextSelected]}>iyzico</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.providerButton, provider === "paytr" && styles.providerSelected]} onPress={() => setProvider("paytr")}>
                <Text style={[styles.providerText, provider === "paytr" && styles.providerTextSelected]}>PayTR</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={[styles.payButton, busy && styles.buttonDisabled]} onPress={handlePay} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.payButtonText}>{prices ? prices[selected.key] : ""} Öde</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelected(null); setError(null); }} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.securityNote}>
          Kart bilgileriniz cihazda saklanmaz; 3D Secure doğrulaması bankanızla yapılır.
        </Text>
      </ScrollView>

      {/* 3D Secure sayfası */}
      <Modal visible={!!threeDs} animationType="slide">
        <SafeAreaView style={styles.threeDsContainer}>
          <View style={styles.threeDsHeader}>
            <Text style={styles.threeDsTitle}>3D Secure Doğrulama</Text>
            <TouchableOpacity
              onPress={() => {
                setThreeDs(null);
                setSelected(null);
                setPayResult("success");
              }}
            >
              <Text style={styles.threeDsClose}>Kapat</Text>
            </TouchableOpacity>
          </View>
          {threeDs && (
            Platform.OS === "web" ? (
              // Web önizlemesi: iframe ile 3DS HTML'i gösterilir
              <iframe title="3D Secure" srcDoc={threeDs.html} style={styles.threeDsFrame as never} />
            ) : (
              <ThreeDsWebView html={threeDs.html} onDone={() => { setThreeDs(null); setSelected(null); setPayResult("success"); }} />
            )
          )}
        </SafeAreaView>
      </Modal>

      {/* Ödeme sonucu */}
      <Modal visible={payResult === "success"} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            <Text style={styles.resultTitle}>Ödemeniz alındı</Text>
            <Text style={styles.resultBody}>Lisansınız kısa süre içinde uzatılacak. Onay gecikirse birkaç dakika sonra tekrar deneyin.</Text>
            <TouchableOpacity style={styles.resultButton} onPress={() => { setPayResult(null); router.back(); }}>
              <Text style={styles.resultButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ThreeDsWebView({ html, onDone }: { html: string; onDone: () => void }) {
  const WebView = require("react-native-webview").default;
  return <WebView originWhitelist={["*"]} source={{ html }} onNavigationStateChange={(state: { url?: string }) => { if (state.url?.includes("callback")) onDone(); }} style={{ flex: 1 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing(2.5), paddingTop: spacing(1) },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  scroll: { padding: spacing(2.5), paddingBottom: spacing(5) },
  subtitle: { color: colors.textMuted, fontSize: 14, marginVertical: spacing(2) },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  planCard: {
    flexBasis: "48%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    alignItems: "center",
    gap: spacing(1),
  },
  planSelected: { borderColor: colors.primary, borderWidth: 2 },
  tagBadge: { position: "absolute", top: spacing(1), right: spacing(1), backgroundColor: colors.success, borderRadius: 999, paddingHorizontal: spacing(1), paddingVertical: 2 },
  tagText: { color: colors.text, fontSize: 10, fontWeight: "700" },
  planName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  planPrice: { color: colors.primary, fontSize: 18, fontWeight: "800" },
  checkoutCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, padding: spacing(2.5), marginTop: spacing(2.5) },
  checkoutTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing(1.5) },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: spacing(1), marginTop: spacing(1.5) },
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
  rowInputs: { flexDirection: "row", gap: spacing(1.5) },
  providerRow: { flexDirection: "row", gap: spacing(1.5) },
  providerButton: { flex: 1, alignItems: "center", paddingVertical: spacing(1.5), borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  providerSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  providerText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  providerTextSelected: { color: colors.text, fontWeight: "700" },
  payButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing(1.75), alignItems: "center", marginTop: spacing(3) },
  buttonDisabled: { opacity: 0.6 },
  payButtonText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cancelLink: { alignItems: "center", marginTop: spacing(2) },
  cancelText: { color: colors.textMuted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing(1.5) },
  securityNote: { color: colors.textDim, fontSize: 12, textAlign: "center", marginTop: spacing(3), paddingHorizontal: spacing(2) },
  threeDsContainer: { flex: 1, backgroundColor: colors.bg },
  threeDsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing(2.5) },
  threeDsTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  threeDsClose: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  threeDsFrame: { flex: 1, borderWidth: 0 },
  resultOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: spacing(3) },
  resultCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing(3), alignItems: "center", gap: spacing(1.5), width: "100%", borderWidth: 1, borderColor: colors.border },
  resultTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  resultBody: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  resultButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing(1.5), paddingHorizontal: spacing(4), marginTop: spacing(1.5) },
  resultButtonText: { color: colors.text, fontSize: 15, fontWeight: "700" },
});

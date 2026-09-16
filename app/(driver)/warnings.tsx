import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { getWarnings, Warning } from "../../src/api/extras";

export default function DriverWarningsScreen() {
  const [items, setItems] = useState<Warning[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getWarnings();
      setItems(data);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Uyarılarım</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { borderColor: item.severity === "blacklist" ? colors.danger : colors.warning },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name={item.severity === "blacklist" ? "close-circle" : "warning"}
                size={18}
                color={item.severity === "blacklist" ? colors.danger : colors.warning}
              />
              <Text style={styles.cardType}>
                {item.severity === "blacklist" ? "Kara Liste Kaydı" : "Uyarı"}
              </Text>
            </View>
            <Text style={styles.cardReason}>{item.reason}</Text>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString("tr-TR")}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="shield-checkmark-outline" size={40} color={colors.success} />
            <Text style={styles.empty}>Hiç uyarınız yok. Böyle devam!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(2.5), paddingTop: spacing(2), paddingBottom: spacing(1) },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  list: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(3) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing(2),
    marginBottom: spacing(1.5),
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  cardType: { color: colors.text, fontSize: 14, fontWeight: "700" },
  cardReason: { color: colors.textMuted, fontSize: 14, marginTop: spacing(1) },
  cardDate: { color: colors.textDim, fontSize: 11, marginTop: spacing(1) },
  emptyWrap: { alignItems: "center", marginTop: spacing(6), gap: spacing(1.5) },
  empty: { color: colors.textDim, fontSize: 14 },
});

import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../src/theme/colors";
import { StaggerInView } from "../../src/components/ui/StaggerInView";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  AppNotification,
} from "../../src/api/extras";

const ICONS: Record<AppNotification["type"], keyof typeof Ionicons.glyphMap> = {
  announcement: "megaphone",
  warning: "warning",
  shift: "time",
  system: "information-circle",
};

const COLORS: Record<AppNotification["type"], string> = {
  announcement: colors.primary,
  warning: colors.danger,
  shift: colors.cyan,
  system: colors.textMuted,
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
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

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(item.id);
      } catch {
        // sessiz geç
      }
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // sessiz geç
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Tümünü Okundu Say</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <StaggerInView index={index}>
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${COLORS[item.type]}22` }]}>
              <Ionicons name={ICONS[item.type]} size={18} color={COLORS[item.type]} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.body}</Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString("tr-TR")}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
          </StaggerInView>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Henüz bildirim bulunmuyor.</Text>}
      />
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
  markAllText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(3) },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    gap: spacing(1.5),
  },
  cardUnread: { borderColor: colors.primary },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  cardText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cardDate: { color: colors.textDim, fontSize: 11, marginTop: spacing(0.75) },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  empty: { color: colors.textDim, textAlign: "center", marginTop: spacing(4) },
});

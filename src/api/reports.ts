import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, TOKEN_KEY } from "./client";

/**
 * Kapalı mesailerin CSV dökümünü indirir.
 * - Native: API'den çekip geçici dosyaya yazar, paylaşım sayfasını açar.
 * - Web: Blob ile tarayıcı indirmesini tetikler (preview'da da çalışır).
 */
export async function downloadShiftsCsv(month?: string): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/shifts-csv${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Rapor alınamadı");

  const blob = await res.blob();
  const filename = month ? `tagsimetre-rapor-${month}.csv` : "tagsimetre-rapor-tumu.csv";

  if (Platform.OS === "web") {
    // Web: tarayıcı indirmesi
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // Native: geçici dosyaya yaz + paylaş
  const fs = await import("expo-file-system");
  const sharing = await import("expo-sharing");
  const cacheDir = (fs as { cacheDirectory?: string | null }).cacheDirectory ?? "";
  const fileUri = `${cacheDir}${filename}`;
  await fs.writeAsStringAsync(fileUri, await blob.text(), { encoding: "utf8" });

  const isAvailable = await sharing.isAvailableAsync();
  if (!isAvailable) throw new Error("Paylaşım bu cihazda kullanılamıyor");
  await sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Raporu kaydet" });
}

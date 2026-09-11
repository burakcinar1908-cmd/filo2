import { create } from "zustand";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { api } from "../api/client";
import {
  LOCATION_TASK_NAME,
  getQueuedPoints,
  clearQueuedPoints,
  clearAllQueuedPoints,
} from "../tasks/locationTask";

export type ShiftStatus = "closed" | "active";
export type GpsStatus = "off" | "permission_required" | "active" | "syncing";

interface ActiveShift {
  id: string;
  vehicle_id: string;
  start_km: number;
  start_time: string;
}

interface ShiftState {
  shift: ActiveShift | null;
  shiftStatus: ShiftStatus;
  gpsStatus: GpsStatus;
  syncError: string | null;

  loadActiveShift: () => Promise<void>;
  startShift: (vehicleId: string, startKm: number) => Promise<void>;
  endShift: (endKm: number, grossRevenue: number) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shift: null,
  shiftStatus: "closed",
  gpsStatus: "off",
  syncError: null,

  loadActiveShift: async () => {
    try {
      const { data } = await api.get("/shifts/active");
      if (data) {
        set({
          shift: { id: data.id, vehicle_id: data.vehicle_id, start_km: data.start_km, start_time: data.start_time },
          shiftStatus: "active",
        });
        // Uygulama yeniden açıldıysa (telefon yeniden başlatılmış olabilir) backend'deki mesai durumu esastır.
        const alreadyTracking = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (!alreadyTracking) {
          await get().syncOfflineQueue(); // önce eski varsa gönder
          await beginGpsTracking();
          set({ gpsStatus: "active" });
        } else {
          set({ gpsStatus: "active" });
        }
      } else {
        set({ shift: null, shiftStatus: "closed" });
        // Backend'de mesai yoksa GPS de kesinlikle kapalı olmalı, cihazda takılı kalmış task varsa durdur.
        await forceStopAndClearQueue();
        set({ gpsStatus: "off" });
      }
    } catch {
      // sessiz geç — login akışı zaten hata gösterir
    }
  },

  startShift: async (vehicleId: string, startKm: number) => {
    const startTime = new Date().toISOString();
    const { data } = await api.post("/shifts", {
      vehicle_id: vehicleId,
      start_km: startKm,
      start_time: startTime,
    });

    set({
      shift: { id: data.id, vehicle_id: vehicleId, start_km: startKm, start_time: startTime },
      shiftStatus: "active",
    });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      set({ gpsStatus: "permission_required" });
      return;
    }
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== "granted") {
      // Foreground izin yeterli sayılmaz — spec, mesai boyunca (arka planda dahil) takip istiyor.
      // Yine de foreground ile başlatabiliriz; kullanıcıya UI üzerinden "Her Zaman İzin Ver" hatırlatılır.
      set({ gpsStatus: "permission_required" });
    }

    await beginGpsTracking();
    set({ gpsStatus: "active" });
  },

  endShift: async (endKm: number, grossRevenue: number) => {
    const current = get().shift;
    if (!current) return;
    const endTime = new Date().toISOString();

    // KESİN KURAL: Mesai bitince GPS hemen durur — backend onayını beklemeden önce durduruyoruz ki
    // ağ gecikmesi sırasında bile yeni konum toplanmasın. Kuyruk SİLİNMEZ, senkronize edilecek.
    await stopGpsTracking();
    set({ gpsStatus: "off" });

    await api.put("/shifts/end", {
      shift_id: current.id,
      end_km: endKm,
      gross_revenue: grossRevenue,
      end_time: endTime,
    });

    // Mesai kapandıktan sonra kuyrukta kalan (mesai açıkken üretilmiş) son kayıtları gönder.
    await get().syncOfflineQueue();

    set({ shift: null, shiftStatus: "closed" });
  },

  syncOfflineQueue: async () => {
    const shift = get().shift;
    if (!shift) return;
    const points = await getQueuedPoints();
    if (points.length === 0) return;

    set({ gpsStatus: "syncing" });
    try {
      const { data } = await api.post("/location/update", {
        shift_id: shift.id,
        points,
      });
      await clearQueuedPoints(points.map((p) => p.client_id));
      set({ syncError: null });
    } catch (err) {
      // İnternet hâlâ yoksa kuyrukta bırak, bir sonraki senkronizasyonda tekrar denenir.
      set({ syncError: err instanceof Error ? err.message : "Senkronizasyon hatası" });
    } finally {
      set({ gpsStatus: get().shift ? "active" : "off" });
    }
  },
}));

async function beginGpsTracking() {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 20000, // 20 sn — batarya/veri dengesi
    distanceInterval: 50, // 50 metre altı hareketsizlikte gereksiz veri gönderme
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Tagsimetre - Mesai Aktif",
      notificationBody: "Konumunuz mesai süresince iletiliyor.",
    },
    pausesUpdatesAutomatically: false,
  });
}

async function stopGpsTracking() {
  const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

/** Backend'de mesai zaten kapalıyken (ör. uygulama açılışında tutarsızlık bulunursa) task'ı durdurur ve kuyruğu temizler. */
async function forceStopAndClearQueue() {
  await stopGpsTracking();
  await clearAllQueuedPoints();
}

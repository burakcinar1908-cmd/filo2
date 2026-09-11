import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export const LOCATION_TASK_NAME = "tagsimetre-shift-location-task";
const QUEUE_KEY = "tagsimetre_location_queue";
const MAX_QUEUE_SIZE = 500; // sınırsız kuyruk yasak (spec madde 21) — makul bir üst sınır

interface QueuedPoint {
  client_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

/**
 * KESİN KURAL: Bu task yalnızca mesai aktifken çalışır.
 * startLocationUpdatesAsync çağrıldığında (mesai başlarken) devreye girer,
 * stopLocationUpdatesAsync çağrıldığında (mesai biterken) tamamen durur.
 * Task tanımı component dışında, modül yüklenirken bir kere register edilir.
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn("Location task error:", error.message);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const points: QueuedPoint[] = locations.map((loc) => ({
    client_id: uuidv4(),
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    speed: loc.coords.speed,
    heading: loc.coords.heading,
    recorded_at: new Date(loc.timestamp).toISOString(),
  }));

  await enqueuePoints(points);
});

export async function enqueuePoints(points: QueuedPoint[]) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedPoint[] = raw ? JSON.parse(raw) : [];
  queue.push(...points);
  // Kuyruk sınırsız değil: en eski kayıtları at, sonsuz büyümeyi engelle.
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
}

export async function getQueuedPoints(): Promise<QueuedPoint[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearQueuedPoints(sentClientIds: string[]) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedPoint[] = raw ? JSON.parse(raw) : [];
  const remaining = queue.filter((p) => !sentClientIds.includes(p.client_id));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export async function clearAllQueuedPoints() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

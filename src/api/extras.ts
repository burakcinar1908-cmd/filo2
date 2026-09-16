import { api } from "./client";

export interface AppNotification {
  id: string;
  user_id: string;
  type: "announcement" | "warning" | "shift" | "system";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get("/notifications");
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put("/notifications/read-all");
}

export interface Warning {
  id: string;
  admin_id: string;
  personnel_id: string;
  reason: string;
  severity: "warning" | "blacklist";
  created_at: string;
}

export interface WarningPayload {
  personnel_id: string;
  reason: string;
  severity: "warning" | "blacklist";
}

export async function getWarnings(): Promise<Warning[]> {
  const { data } = await api.get("/warnings");
  return data;
}

export async function getWarningsForPersonnel(personnelId: string): Promise<Warning[]> {
  const { data } = await api.get(`/warnings/personnel/${personnelId}`);
  return data;
}

export async function createWarning(payload: WarningPayload): Promise<Warning> {
  const { data } = await api.post("/warnings", payload);
  return data;
}

export interface PerformanceSummary {
  personnel_id: string;
  score: number;
  warning_count: number;
  blacklist_count: number;
  completed_shifts: number;
}

export async function getPerformance(personnelId: string): Promise<PerformanceSummary> {
  const { data } = await api.get(`/performance/${personnelId}`);
  return data;
}

export async function adjustPerformance(personnelId: string, delta: number, reason: string): Promise<void> {
  await api.post("/performance/adjust", { personnel_id: personnelId, delta, reason });
}

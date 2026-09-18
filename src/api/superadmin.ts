import { api } from "./client";

// Backend: server.py /superadmin/* + extras_api.py /superadmin/payments
export interface SuperAdminListItem {
  id: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone: string;
  is_active: boolean;
  trial_end_date: string;
  license_end_date: string | null;
  max_vehicles: number;
  max_personnel: number;
  created_at: string;
}

export interface AdminPayment {
  merchant_oid: string;
  company_name: string;
  provider: string;
  months: number;
  amount_kurus: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
}

export async function getAdmins(): Promise<SuperAdminListItem[]> {
  const { data } = await api.get<SuperAdminListItem[]>("/superadmin/admins");
  return data;
}

export async function toggleAdmin(adminId: string, isActive: boolean): Promise<{ message: string }> {
  const { data } = await api.put(`/superadmin/admin/${adminId}/toggle`, { is_active: isActive });
  return data;
}

export async function deleteAdmin(adminId: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/superadmin/admin/${adminId}`);
  return data;
}

export async function addLicense(adminId: string, months: number): Promise<{ message: string; license_end_date: string }> {
  const { data } = await api.post("/superadmin/license", { admin_id: adminId, months, action: "add" });
  return data;
}

export async function updateLimits(adminId: string, maxVehicles: number, maxPersonnel: number): Promise<{ message: string }> {
  const { data } = await api.put("/superadmin/limits", { admin_id: adminId, max_vehicles: maxVehicles, max_personnel: maxPersonnel });
  return data;
}

export async function getPayments(): Promise<AdminPayment[]> {
  const { data } = await api.get<AdminPayment[]>("/superadmin/payments");
  return data;
}

// ---------------------------------------------------------------------------
// Fiyat düzenleme (backend PUT /superadmin/license-prices)
// ---------------------------------------------------------------------------
export interface LicensePrices {
  month_1: string;
  month_3: string;
  month_6: string;
  month_12: string;
}

export async function getLicensePrices(): Promise<LicensePrices> {
  const { data } = await api.get<LicensePrices>("/license-prices");
  return data;
}

export async function updateLicensePrices(prices: LicensePrices): Promise<{ message: string }> {
  const { data } = await api.put("/superadmin/license-prices", prices);
  return data;
}

// ---------------------------------------------------------------------------
// Platform istatistikleri (GET /superadmin/dashboard)
// ---------------------------------------------------------------------------
export interface PlatformStats {
  total_admins: number;
  active_admins: number;
  trial_admins: number;
  expired_admins: number;
  passive_admins: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<PlatformStats>("/superadmin/dashboard");
  return data;
}

// ---------------------------------------------------------------------------
// Herkese duyuru (POST /announcements, target_role: "all")
// ---------------------------------------------------------------------------
export async function announceToAll(title: string, content: string): Promise<{ message: string }> {
  const { data } = await api.post("/announcements", {
    title,
    content,
    target_role: "all",
    target_ids: null,
  });
  return data;
}

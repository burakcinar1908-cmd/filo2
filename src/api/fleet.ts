import { api } from "./client";

export interface Vehicle {
  id: string;
  admin_id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  fuel_consumption_per_100km: number;
  is_active: boolean;
}

export interface VehiclePayload {
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  fuel_consumption_per_100km: number;
  is_active?: boolean;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await api.get("/vehicles");
  return data;
}

export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  const { data } = await api.post("/vehicles", payload);
  return data;
}

export async function updateVehicle(id: string, payload: Partial<VehiclePayload>): Promise<{ message: string }> {
  const { data } = await api.put(`/vehicles/${id}`, payload);
  return data;
}

export interface AdminDashboard {
  total_vehicles: number;
  active_vehicles: number;
  total_personnel: number;
  active_personnel: number;
  total_shifts: number;
  open_shifts: number;
  total_revenue: number;
  total_profit: number;
  license_status: "active" | "trial" | "expired";
  license_end_date: string | null;
  trial_end_date: string;
  max_vehicles: number;
  max_personnel: number;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export interface Personnel {
  id: string;
  admin_id: string;
  name: string;
  email: string;
  phone: string;
  permissions: string[];
  is_active: boolean;
}

export interface PersonnelPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  permissions?: string[];
}

export async function getPersonnel(): Promise<Personnel[]> {
  const { data } = await api.get("/personnel");
  return data;
}

export async function createPersonnel(payload: PersonnelPayload): Promise<Personnel> {
  const { data } = await api.post("/personnel", payload);
  return data;
}

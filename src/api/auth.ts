import { api } from "./client";

/** API hata yanıtındaki Türkçe mesajı yakalar (ör. "Bu e-posta zaten kullanılıyor"). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || (err instanceof Error ? err.message : fallback);
}

export type Role = "superadmin" | "admin" | "personnel";

export interface LoginResult {
  token: string;
  user: Record<string, unknown>;
  role: Role;
}

// Backend'de üç ayrı login endpoint'i var; rol seçimini kullanıcı yapmaz,
// giriş ekranında hangi route'un başarılı döndüğüne göre rol belirlenir.
export async function loginSuperAdmin(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post("/auth/superadmin/login", { email, password });
  return { token: data.token, user: data.user, role: "superadmin" };
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post("/auth/admin/login", { email, password });
  return { token: data.token, user: data.user, role: "admin" };
}

export async function loginPersonnel(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post("/auth/personnel/login", { email, password });
  return { token: data.token, user: data.user, role: "personnel" };
}

export interface RegisterPayload {
  email: string;
  password: string;
  company_name: string;
  contact_name: string;
  phone: string;
}

export async function registerAdmin(payload: RegisterPayload): Promise<LoginResult> {
  const { data } = await api.post("/auth/admin/register", payload);
  return { token: data.token, user: data.user, role: "admin" };
}

export interface RegisterWithRecoveryResult extends LoginResult {
  recovery_code: string;
}

/** Kayıt + 9 haneli kurtarma kodu (şifremi unuttum için). */
export async function registerAdminWithRecovery(payload: RegisterPayload): Promise<RegisterWithRecoveryResult> {
  const { data } = await api.post("/auth/admin/register-with-recovery", payload);
  return { token: data.token, user: data.user, role: "admin", recovery_code: data.recovery_code };
}

/** Admin: e-posta + kurtarma kodu + yeni şifre. */
export async function adminForgotPassword(email: string, recoveryCode: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post("/auth/forgot-password-admin", {
    email,
    recovery_code: recoveryCode,
    new_password: newPassword,
  });
  return data;
}

/** Sürücü: talep adminine bildirim olarak gider. */
export async function driverForgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post("/auth/forgot-password-driver", { email });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

export async function getRecoveryCode(): Promise<{ recovery_code: string | null }> {
  const { data } = await api.get("/auth/recovery-code");
  return data;
}

export async function resetPersonnelPassword(personnelId: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.put(`/personnel/${personnelId}/reset-password`, { new_password: newPassword });
  return data;
}

export async function initSuperAdmin(): Promise<{ message: string }> {
  const { data } = await api.post("/superadmin/init");
  return data;
}

/**
 * Spec'e göre kullanıcı sadece email+şifre girer, rolünü seçmez.
 * Backend'de tek bir "hangi rol" endpoint'i olmadığından üçünü sırayla dener.
 * NOT: Gerçek backend'de tek login endpoint'i eklenirse (ör. POST /auth/login)
 * bu fonksiyon tek çağrıya indirilmeli — mevcut sistemi bozmamak için üç ayrı
 * endpoint korunuyor.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const attempts = [loginSuperAdmin, loginAdmin, loginPersonnel];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt(email, password);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) throw err; // hız limiti: diğer rollere denemeyin
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Giriş başarısız");
}

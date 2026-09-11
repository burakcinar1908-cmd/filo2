import { api } from "./client";

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
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Giriş başarısız");
}

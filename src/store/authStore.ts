import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "../api/client";
import { login as loginRequest, registerAdminWithRecovery, Role, RegisterPayload } from "../api/auth";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  user: Record<string, unknown> | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  role: null,
  user: null,
  error: null,

  bootstrap: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const roleStr = await SecureStore.getItemAsync("tagsimetre_role");
    const userStr = await SecureStore.getItemAsync("tagsimetre_user");
    if (token && roleStr) {
      set({
        isAuthenticated: true,
        role: roleStr as Role,
        user: userStr ? JSON.parse(userStr) : null,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const result = await loginRequest(email, password);
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await SecureStore.setItemAsync("tagsimetre_role", result.role);
      await SecureStore.setItemAsync("tagsimetre_user", JSON.stringify(result.user));
      set({ isAuthenticated: true, role: result.role, user: result.user });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Giriş başarısız";
      set({ error: message });
      throw err;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ error: null });
    try {
      const result = await registerAdminWithRecovery(payload);
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      await SecureStore.setItemAsync("tagsimetre_role", result.role);
      await SecureStore.setItemAsync("tagsimetre_user", JSON.stringify(result.user));
      set({ isAuthenticated: true, role: result.role, user: result.user });
      return result.recovery_code;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kayıt başarısız";
      set({ error: message });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync("tagsimetre_role");
    await SecureStore.deleteItemAsync("tagsimetre_user");
    set({ isAuthenticated: false, role: null, user: null });
  },
}));

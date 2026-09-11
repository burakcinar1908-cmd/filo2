import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Gerçek üretim adresi. Geliştirme sırasında EXPO_PUBLIC_API_URL ile override edilebilir.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://tagsimetre.com/api";

export const TOKEN_KEY = "tagsimetre_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Backend hata detaylarını UI'ye sade mesaj olarak taşımak için normalize ediyoruz.
    const detail =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      (error?.code === "ECONNABORTED"
        ? "Sunucuya bağlanılamadı."
        : "Bir hata oluştu.");
    return Promise.reject(new Error(detail));
  }
);

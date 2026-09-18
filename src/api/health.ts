import axios from "axios";
import { API_BASE_URL } from "./client";

export interface HealthResult {
  ok: boolean;
  message?: string;
}

/**
 * Backend erisilebilirlik kontrolu — public endpoint (token gerektirmez).
 * Kisa timeout: kullanici acilista bos beklemesin.
 * Not: Yanit hata koduyla bile gelse (5xx) sunucu AYAKTA demektir — erisim var.
 */
export async function checkBackendHealth(): Promise<HealthResult> {
  try {
    await axios.get(`${API_BASE_URL}/license-prices`, { timeout: 8000 });
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { code?: string; response?: { status?: number } };
    // Yanit geldi ama 5xx: tunnel arkasinda origin kapali (502/530) veya sunucu bozuk
    if (e?.response) {
      if ((e.response.status ?? 0) < 500) {
        return { ok: true }; // 4xx bile olsa sunucu AYAKTA — erisim var
      }
      return {
        ok: false,
        message: "Tağsimetre sunucusu şu anda bakımda. Kısa süre sonra tekrar deneyin.",
      };
    }
    if (e?.code === "ECONNABORTED") {
      return { ok: false, message: "Sunucu yanıt vermiyor. Lütfen tekrar deneyin." };
    }
    return {
      ok: false,
      message: "İnternet bağlantınızı kontrol edin. Sorun sürerse sunucu bakımda olabilir.",
    };
  }
}

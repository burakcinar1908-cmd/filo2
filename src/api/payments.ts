import { api } from "./client";

// Backend: payments.py -> /api/payments
export interface LicensePrices {
  month_1: string;
  month_3: string;
  month_6: string;
  month_12: string;
}

export interface PaymentInitResponse {
  provider: string;
  status: "redirect_required" | "success" | "failed";
  merchant_oid: string;
  html_content?: string | null;
  redirect_url?: string | null;
  message?: string | null;
}

export interface PaymentRecord {
  merchant_oid: string;
  admin_id: string;
  provider: string;
  months: number;
  amount_kurus: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface CardInfo {
  card_holder_name: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export async function getLicensePrices(): Promise<LicensePrices> {
  const { data } = await api.get<LicensePrices>("/license-prices");
  return data;
}

export async function initPayment(provider: "paytr" | "iyzico", months: 1 | 3 | 6 | 12, card: CardInfo): Promise<PaymentInitResponse> {
  const { data } = await api.post<PaymentInitResponse>("/payments/init", { provider, months, ...card });
  return data;
}

export async function getPaymentStatus(merchantOid: string): Promise<PaymentRecord> {
  const { data } = await api.get<PaymentRecord>(`/payments/status/${merchantOid}`);
  return data;
}

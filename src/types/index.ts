export interface Gift {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  /** null = sem limite */
  availableQuantity: number | null;
}

export interface RsvpFormData {
  name: string;
  email: string;
  phone: string;
  guestCount: number;
  additionalGuests: string[];
  message?: string;
}

export interface GiftReserveData {
  giftName: string;
  reserverName: string;
  reserverEmail: string;
  reserverPhone: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

export type SectionId =
  | "inicio"
  | "historia"
  | "cerimonia"
  | "presenca"
  | "presentes"
  | "galeria";

export interface PixPayment {
  id: number;
  mercadoPagoId: string | null;
  amount: number;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  type: "gift" | "donation";
  reserverName: string;
  reserverEmail: string;
  giftId: number | null;
  message: string | null;
  giftImageUrl: string | null;
  pixCopiaECola: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdAt: Date | null;
}

export interface PixCreateRequest {
  type: "gift" | "donation";
  reserverName: string;
  reserverEmail: string;
  reserverPhone: string;
  giftName?: string;
  amount?: number;
  message?: string;
}

export interface PixCreateResponse {
  pixPaymentId: number;
  copiaECola: string;
  qrCodeBase64: string | null;
  amount: number;
  expiresAt: string;
}

export interface PixStatusResponse {
  status: "pending" | "approved" | "rejected" | "expired";
  paidAt: string | null;
}


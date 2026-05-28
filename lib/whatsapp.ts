const DEFAULT_WHATSAPP_BASE_URL = "https://wa.me";

export const WHATSAPP_TEMPLATES = {
  greeting: "Hello, this is from CallFlow CRM",
  inquiryFollowup: "Following up regarding your inquiry",
  followupToday: "Your follow-up is scheduled today",
} as const;

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES;

export function sanitizeWhatsAppPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  return phone.replace(/\D+/g, "");
}

export function buildWhatsAppUrl(
  phone: string | undefined | null,
  message?: string,
): string | null {
  const sanitizedPhone = sanitizeWhatsAppPhone(phone);
  if (!sanitizedPhone) return null;

  const baseUrl = `${DEFAULT_WHATSAPP_BASE_URL}/${sanitizedPhone}`;
  const text = message?.trim();
  if (!text) return baseUrl;

  const params = new URLSearchParams({ text });
  return `${baseUrl}?${params.toString()}`;
}

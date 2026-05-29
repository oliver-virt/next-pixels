/** SHA-256 hash of a string, lowercased and trimmed (PII normalization for ad platforms). */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Strip everything except digits (Meta phone format). */
export function digitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/** Normalize to E.164-ish (leading "+" + digits), for TikTok phone hashing. */
export function toE164(phone: string): string {
  const digits = digitsOnly(phone);
  return digits ? `+${digits}` : "";
}

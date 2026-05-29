/** SHA-256 hash of a string, lowercased and trimmed (PII normalization for ad platforms). */
export declare function hashData(data: string): Promise<string>;
/** Strip everything except digits (Meta phone format). */
export declare function digitsOnly(phone: string): string;
/** Normalize to E.164-ish (leading "+" + digits), for TikTok phone hashing. */
export declare function toE164(phone: string): string;
//# sourceMappingURL=hash.d.ts.map
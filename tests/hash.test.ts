import { describe, it, expect } from "vitest";
import { hashData, digitsOnly, toE164 } from "../dist/utils/hash.js";

// SHA-256 vectors precomputed with node:crypto for the normalized inputs.
const SHA256 = {
  "test@example.com":
    "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",
  "972501234567":
    "1b28f71583657cd11ff8ad48a922f9a3b051fdb267ffc4fe88c47db2338629f4",
  "+972501234567":
    "6d7cdf3b1cac797805601c570abacdc7a8620780fa06c11a1c24eabea1468fa4",
};

describe("hashData", () => {
  it("lowercases and trims before hashing (match-rate critical)", async () => {
    // Mixed case + surrounding whitespace must normalize to the same hash.
    expect(await hashData("  Test@Example.COM ")).toBe(SHA256["test@example.com"]);
    expect(await hashData("test@example.com")).toBe(SHA256["test@example.com"]);
  });

  it("produces a 64-char lowercase hex digest", async () => {
    const h = await hashData("anything");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("digitsOnly (Meta phone format)", () => {
  it("strips all non-digits, dropping the + and separators", () => {
    expect(digitsOnly("+972 50-123 4567")).toBe("972501234567");
  });
});

describe("toE164 (TikTok phone format)", () => {
  it("keeps a leading + plus digits — distinct from Meta's digits-only", () => {
    expect(toE164("+972 50-123 4567")).toBe("+972501234567");
  });

  it("returns empty string when there are no digits", () => {
    // Documents the edge case: callers must guard against hashing "".
    expect(toE164("not a phone")).toBe("");
  });
});

describe("phone hashes differ across providers", () => {
  it("Meta digits-only and TikTok E.164 hash to different values", async () => {
    const meta = await hashData(digitsOnly("+972501234567"));
    const tiktok = await hashData(toE164("+972501234567"));
    expect(meta).toBe(SHA256["972501234567"]);
    expect(tiktok).toBe(SHA256["+972501234567"]);
    expect(meta).not.toBe(tiktok);
  });
});

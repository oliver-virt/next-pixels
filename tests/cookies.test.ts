// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { getTtpCookie, getMatchCookies } from "../dist/utils/cookies.js";

function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

describe("getTtpCookie", () => {
  it("reads the _ttp cookie", () => {
    document.cookie = "_ttp=tiktok-cookie";
    expect(getTtpCookie()).toBe("tiktok-cookie");
  });

  it("returns null when _ttp is absent", () => {
    clearCookie("_ttp");
    expect(getTtpCookie()).toBeNull();
  });
});

describe("getMatchCookies", () => {
  it("returns all provider cookies in one object", () => {
    document.cookie = "_fbp=fbp1";
    document.cookie = "_fbc=fbc1";
    document.cookie = "_ttp=ttp1";
    expect(getMatchCookies()).toEqual({ fbp: "fbp1", fbc: "fbc1", ttp: "ttp1" });
  });
});

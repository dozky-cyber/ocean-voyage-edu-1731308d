import { describe, expect, it } from "vitest";

import { classifyHttpError, classifyThrownError, shouldRotate } from "./errors";
import { GeminiKeyPool } from "./provider-state";

const KEYS = ["k1", "k2", "k3", "k4", "k5"];

function first(pool: GeminiKeyPool, now?: number) {
  const order = pool.acquireOrder(now);
  return order[0]?.index ?? null;
}

describe("gemini key pool — round robin", () => {
  it("cycles 1→5 then back to 1", () => {
    const pool = new GeminiKeyPool(KEYS);
    const seen = [1, 2, 3, 4, 5, 6].map(() => first(pool));
    expect(seen).toEqual([1, 2, 3, 4, 5, 1]);
  });

  it("skips a cooling key and restores it after cooldown expiry", () => {
    const pool = new GeminiKeyPool(KEYS);
    const t0 = 1_000_000;
    pool.markFailure(2, "RATE_LIMIT", t0);
    const order = pool.acquireOrder(t0).map((entry) => entry.index);
    expect(order).toEqual([1, 3, 4, 5]);

    // 5 minutes later key 2 is READY again.
    const later = t0 + 5 * 60_000 + 1;
    expect(pool.acquireOrder(later).map((e) => e.index)).toContain(2);
  });

  it("skips a disabled (auth failure) key for 30 minutes", () => {
    const pool = new GeminiKeyPool(KEYS);
    const t0 = 2_000_000;
    pool.markFailure(3, "AUTH_FAILURE", t0);
    expect(pool.acquireOrder(t0).map((e) => e.index)).not.toContain(3);
    expect(pool.snapshot(t0).keys[2]!.status).toBe("DISABLED");
    expect(pool.acquireOrder(t0 + 30 * 60_000 + 1).map((e) => e.index)).toContain(3);
  });

  it("marks missing keys NOT_CONFIGURED and never selects them", () => {
    const pool = new GeminiKeyPool(["k1", undefined, "", "k4", "k5"]);
    expect(pool.configuredCount).toBe(3);
    expect(pool.acquireOrder(1).map((e) => e.index)).toEqual([1, 4, 5]);
    expect(pool.snapshot(1).keys[1]!.status).toBe("NOT_CONFIGURED");
  });

  it("returns an empty order when every key is unavailable (fallback path)", () => {
    const pool = new GeminiKeyPool(KEYS);
    const t0 = 3_000_000;
    for (let i = 1; i <= 5; i += 1) pool.markFailure(i, "QUOTA_EXHAUSTED", t0);
    expect(pool.acquireOrder(t0)).toHaveLength(0);
    expect(pool.acquireOrder(t0 + 5 * 60_000 + 1)).toHaveLength(5);
  });

  it("resets fail state on success", () => {
    const pool = new GeminiKeyPool(KEYS);
    pool.markFailure(1, "TRANSIENT_PROVIDER", 10);
    pool.markSuccess(1, 20);
    const state = pool.snapshot(20).keys[0]!;
    expect(state.status).toBe("READY");
    expect(state.failCount).toBe(0);
    expect(state.lastSuccessAt).toBe(20);
  });

  it("never penalizes a key for an invalid request", () => {
    const pool = new GeminiKeyPool(KEYS);
    pool.markFailure(1, "REQUEST_INVALID", 10);
    expect(pool.snapshot(10).keys[0]!.status).toBe("READY");
  });

  it("keeps a concurrent burst of selections within the configured pool", () => {
    const pool = new GeminiKeyPool(KEYS);
    const picks = Array.from({ length: 20 }, () => first(pool));
    expect(picks.every((index) => index !== null && index >= 1 && index <= 5)).toBe(true);
    expect(new Set(picks).size).toBe(5);
  });
});

describe("error classification", () => {
  it("classifies provider statuses", () => {
    expect(classifyHttpError(429)).toBe("RATE_LIMIT");
    expect(classifyHttpError(429, "quota exceeded")).toBe("QUOTA_EXHAUSTED");
    expect(classifyHttpError(401)).toBe("AUTH_FAILURE");
    expect(classifyHttpError(403, "permission denied")).toBe("AUTH_FAILURE");
    expect(classifyHttpError(503)).toBe("TRANSIENT_PROVIDER");
    expect(classifyHttpError(408)).toBe("TIMEOUT");
    expect(classifyHttpError(400, "invalid json payload")).toBe("REQUEST_INVALID");
  });

  it("rotates on provider faults but never on an invalid request", () => {
    expect(shouldRotate("RATE_LIMIT")).toBe(true);
    expect(shouldRotate("QUOTA_EXHAUSTED")).toBe(true);
    expect(shouldRotate("TRANSIENT_PROVIDER")).toBe(true);
    expect(shouldRotate("TIMEOUT")).toBe(true);
    expect(shouldRotate("AUTH_FAILURE")).toBe(true);
    expect(shouldRotate("REQUEST_INVALID")).toBe(false);
    expect(shouldRotate("SCHEMA_INVALID")).toBe(false);
    expect(shouldRotate("CONTENT_REJECTED")).toBe(false);
  });

  it("classifies thrown network errors", () => {
    expect(classifyThrownError(new Error("The operation was aborted"))).toBe("TIMEOUT");
    expect(classifyThrownError(new Error("connection reset"))).toBe("TRANSIENT_PROVIDER");
  });
});

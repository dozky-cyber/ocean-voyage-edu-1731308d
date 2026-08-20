import { COOLDOWN_MS } from "./errors";
import type { AiErrorClass, KeyState, KeyStateView, PoolStats } from "./types";

/**
 * Gemini API key pool with global round-robin + cooldown.
 *
 * State lives in process memory. The Kerjaku backend runs as a serverless
 * worker, so each instance keeps its own pointer/cooldown view. That is
 * intentional and safe: rotation correctness never depends on perfect global
 * ordering — each instance independently skips keys it has seen failing and
 * re-evaluates cooldown expiry on every request.
 */
export class GeminiKeyPool {
  private readonly keys: (string | null)[];
  private readonly states: KeyState[];
  private pointer = 0;
  private stats: PoolStats = {
    requests: 0,
    success: 0,
    fallbackUsed: 0,
    rateLimited: 0,
    authFailures: 0,
  };

  constructor(keys: (string | undefined | null)[]) {
    this.keys = keys.map((key) => {
      const trimmed = typeof key === "string" ? key.trim() : "";
      return trimmed.length > 0 ? trimmed : null;
    });
    this.states = this.keys.map((key, i) => ({
      index: i + 1,
      status: key ? "READY" : "NOT_CONFIGURED",
      lastErrorClass: null,
      lastErrorAt: null,
      cooldownUntil: null,
      failCount: 0,
      lastSuccessAt: null,
      lastAttemptAt: null,
    }));
  }

  get configuredCount(): number {
    return this.keys.filter(Boolean).length;
  }

  /** Restore any key whose cooldown has expired. */
  private refresh(now: number) {
    for (const state of this.states) {
      if (
        (state.status === "COOLING_DOWN" || state.status === "DISABLED") &&
        state.cooldownUntil !== null &&
        state.cooldownUntil <= now
      ) {
        state.status = "READY";
        state.cooldownUntil = null;
      }
    }
  }

  /**
   * Ordered list of usable keys for a single request, starting at the
   * round-robin pointer. Cooling/disabled/unconfigured keys are skipped.
   */
  acquireOrder(now = Date.now()): { index: number; key: string }[] {
    this.refresh(now);
    const order: { index: number; key: string }[] = [];
    const size = this.keys.length;
    const start = this.pointer;
    for (let step = 0; step < size; step += 1) {
      const i = (start + step) % size;
      const key = this.keys[i];
      if (!key) continue;
      if (this.states[i]!.status !== "READY") continue;
      order.push({ index: i + 1, key });
    }
    if (order.length > 0) {
      // Advance pointer so the next request starts on the following key.
      this.pointer = order[0]!.index % size;
    }
    return order;
  }

  markAttempt(index: number, now = Date.now()) {
    const state = this.states[index - 1];
    if (!state) return;
    state.lastAttemptAt = now;
    this.stats.requests += 1;
  }

  markSuccess(index: number, now = Date.now()) {
    const state = this.states[index - 1];
    if (!state) return;
    state.status = "READY";
    state.cooldownUntil = null;
    state.failCount = 0;
    state.lastSuccessAt = now;
    this.stats.success += 1;
  }

  markFailure(index: number, errorClass: AiErrorClass, now = Date.now()) {
    const state = this.states[index - 1];
    if (!state) return;
    state.lastErrorClass = errorClass;
    state.lastErrorAt = now;
    state.failCount += 1;

    if (errorClass === "AUTH_FAILURE") {
      state.status = "DISABLED";
      state.cooldownUntil = now + COOLDOWN_MS.AUTH_FAILURE;
      this.stats.authFailures += 1;
      return;
    }
    if (errorClass === "RATE_LIMIT" || errorClass === "QUOTA_EXHAUSTED") {
      state.status = "COOLING_DOWN";
      state.cooldownUntil = now + COOLDOWN_MS.RATE_LIMIT;
      this.stats.rateLimited += 1;
      return;
    }
    if (errorClass === "TRANSIENT_PROVIDER" || errorClass === "TIMEOUT") {
      state.status = "COOLING_DOWN";
      state.cooldownUntil = now + COOLDOWN_MS.TRANSIENT_PROVIDER;
    }
    // REQUEST_INVALID / SCHEMA_INVALID etc. never penalize the key.
  }

  markFallbackUsed() {
    this.stats.fallbackUsed += 1;
  }

  /** Secret-free snapshot for admin diagnostics. */
  snapshot(now = Date.now()): { keys: KeyStateView[]; stats: PoolStats } {
    this.refresh(now);
    return {
      keys: this.states.map((state) => ({
        ...state,
        cooldownUntil: state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : null,
      })),
      stats: { ...this.stats },
    };
  }
}

let singleton: GeminiKeyPool | null = null;

/** Lazily builds the pool from GEMINI_API_KEY_1..5 (missing keys stay unconfigured). */
export function getGeminiPool(): GeminiKeyPool {
  if (!singleton) {
    singleton = new GeminiKeyPool([
      process.env["GEMINI_API_KEY_1"],
      process.env["GEMINI_API_KEY_2"],
      process.env["GEMINI_API_KEY_3"],
      process.env["GEMINI_API_KEY_4"],
      process.env["GEMINI_API_KEY_5"],
    ]);
  }
  return singleton;
}

/** Test helper — rebuilds the singleton from the current environment. */
export function resetGeminiPool() {
  singleton = null;
}

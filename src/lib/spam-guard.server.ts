/**
 * Server-only spam protection for public lead submissions.
 *
 * Two cheap layers that never block a normal visitor:
 *  - honeypot: a hidden field real users never fill in.
 *  - rate limiting: a sliding window per client IP, generous enough for
 *    genuine retries but tight enough to stop scripted floods.
 *
 * The limiter is in-memory (per server instance). It is a best-effort guard,
 * not a distributed quota.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5; // submissions per IP per window
const MIN_FILL_MS = 2000; // a human needs at least ~2s to fill the form

const hits = new Map<string, number[]>();

function prune(now: number) {
  if (hits.size < 500) return;
  for (const [key, stamps] of hits) {
    const fresh = stamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

export type SpamVerdict = { ok: true } | { ok: false; reason: "honeypot" | "too_fast" | "rate_limited" };

export function checkSpam(input: {
  ip: string;
  honeypot?: string | undefined;
  elapsedMs?: number | undefined;
}): SpamVerdict {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }
  if (typeof input.elapsedMs === "number" && input.elapsedMs > 0 && input.elapsedMs < MIN_FILL_MS) {
    return { ok: false, reason: "too_fast" };
  }

  const now = Date.now();
  prune(now);
  const key = input.ip || "unknown";
  const stamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= MAX_PER_WINDOW) {
    hits.set(key, stamps);
    return { ok: false, reason: "rate_limited" };
  }
  stamps.push(now);
  hits.set(key, stamps);
  return { ok: true };
}

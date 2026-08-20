import type { AiErrorClass } from "./types";

/** Cooldown durations (ms) applied per normalized error class. */
export const COOLDOWN_MS = {
  RATE_LIMIT: 5 * 60_000,
  QUOTA_EXHAUSTED: 5 * 60_000,
  TRANSIENT_PROVIDER: 60_000,
  TIMEOUT: 60_000,
  AUTH_FAILURE: 30 * 60_000,
} as const;

/** Classify an HTTP response from an OpenAI-compatible provider. */
export function classifyHttpError(status: number, bodyText = ""): AiErrorClass {
  const body = bodyText.toLowerCase();
  if (status === 429) return body.includes("quota") ? "QUOTA_EXHAUSTED" : "RATE_LIMIT";
  if (status === 401) return "AUTH_FAILURE";
  if (status === 403) {
    if (body.includes("quota") || body.includes("resource_exhausted")) return "QUOTA_EXHAUSTED";
    return "AUTH_FAILURE";
  }
  if (status === 400) {
    if (body.includes("resource_exhausted") || body.includes("quota_exceeded")) {
      return "QUOTA_EXHAUSTED";
    }
    return "REQUEST_INVALID";
  }
  if (status === 404 || status === 405 || status === 413 || status === 422) {
    return "REQUEST_INVALID";
  }
  if (status === 408) return "TIMEOUT";
  if (status >= 500) return "TRANSIENT_PROVIDER";
  return "UNKNOWN";
}

/** Classify a thrown network/abort error. */
export function classifyThrownError(error: unknown): AiErrorClass {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (message.includes("abort") || message.includes("timeout") || message.includes("timed out")) {
    return "TIMEOUT";
  }
  return "TRANSIENT_PROVIDER";
}

/** Errors that should rotate to another key. A REQUEST_INVALID must never rotate the pool. */
export function shouldRotate(errorClass: AiErrorClass): boolean {
  return (
    errorClass === "RATE_LIMIT" ||
    errorClass === "QUOTA_EXHAUSTED" ||
    errorClass === "TRANSIENT_PROVIDER" ||
    errorClass === "TIMEOUT" ||
    errorClass === "AUTH_FAILURE" ||
    errorClass === "PROVIDER_UNAVAILABLE"
  );
}

/** Transient classes deserve one immediate short retry on the same key. */
export function shouldRetrySameKey(errorClass: AiErrorClass): boolean {
  return errorClass === "TRANSIENT_PROVIDER" || errorClass === "TIMEOUT";
}

/** Central AI Gateway — shared types (server-only usage). */

/** Internal feature identifier. Used for logging/monitoring only, never business rules. */
export type AiFeature =
  | "CHATBOT"
  | "TELEGRAM"
  | "ORDER_BRIEF"
  | "PROPOSAL"
  | "FEATURE_RECOMMENDATION"
  | "AI_ASSISTANT"
  | "AI_MEMORY"
  | "LEAD_ANALYSIS"
  | "MESSAGE_GENERATION"
  | "DAILY_BRIEF"
  | "OTHER";

/** Normalized provider error classification. */
export type AiErrorClass =
  | "RATE_LIMIT"
  | "QUOTA_EXHAUSTED"
  | "TRANSIENT_PROVIDER"
  | "AUTH_FAILURE"
  | "REQUEST_INVALID"
  | "SCHEMA_INVALID"
  | "CONTENT_REJECTED"
  | "TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN";

export type KeyStatus = "READY" | "COOLING_DOWN" | "DISABLED" | "NOT_CONFIGURED";

export type KeyState = {
  index: number;
  status: KeyStatus;
  lastErrorClass: AiErrorClass | null;
  lastErrorAt: number | null;
  cooldownUntil: number | null;
  failCount: number;
  lastSuccessAt: number | null;
  lastAttemptAt: number | null;
};

/** Public (secret-free) view of a pool key, safe for admin diagnostics. */
export type KeyStateView = Omit<KeyState, "cooldownUntil"> & { cooldownUntil: string | null };

export type PoolStats = {
  requests: number;
  success: number;
  fallbackUsed: number;
  rateLimited: number;
  authFailures: number;
};

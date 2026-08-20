/**
 * Compatibility shim — server-only.
 *
 * All Kerjaku AI features now go through the Central AI Gateway
 * (`src/lib/ai/router.ts`): Gemini key pool 1–5 with round-robin + cooldown,
 * and Lovable AI as last-resort fallback.
 */
export { createAiModel, DEFAULT_AI_MODEL as ASSISTANT_MODEL, aiPoolSnapshot } from "@/lib/ai/router";
export { isAiConfigured } from "@/lib/ai/router";
export type { AiFeature } from "@/lib/ai/types";

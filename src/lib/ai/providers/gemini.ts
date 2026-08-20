/**
 * Gemini provider adapter (OpenAI-compatible endpoint).
 * Keys are read server-side only and never leave this module.
 */
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

/** Maps a gateway model id ("google/gemini-3.6-flash") to a native Gemini model id. */
export function toGeminiModel(modelId: string): string {
  const override = process.env["GEMINI_MODEL_DEFAULT"]?.trim();
  if (override) return override;
  return modelId.replace(/^google\//, "");
}

export function geminiRequest(url: string, apiKey: string, headers: Headers) {
  const next = new Headers(headers);
  next.delete("Lovable-API-Key");
  next.set("Authorization", `Bearer ${apiKey}`);
  const path = new URL(url).pathname.replace(/^.*\/v1(beta)?/, "");
  return { url: `${GEMINI_BASE_URL}${path || "/chat/completions"}`, headers: next };
}

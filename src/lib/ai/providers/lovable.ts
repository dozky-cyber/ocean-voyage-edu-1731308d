/** Lovable AI Gateway adapter — last-resort fallback provider. */
import { endpointPath } from "./path";

export const LOVABLE_BASE_URL = "https://ai.gateway.lovable.dev/v1";

export function lovableApiKey(): string | null {
  const key =
    process.env["LOVABLE_API_KEY"]?.trim() || process.env["LOVABLE_AI_GATEWAY_KEY"]?.trim();
  return key && key.length > 0 ? key : null;
}

export function lovableFallbackEnabled(): boolean {
  const flag = process.env["LOVABLE_AI_FALLBACK_ENABLED"]?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return true;
}

export function lovableModel(modelId: string): string {
  return process.env["LOVABLE_AI_MODEL"]?.trim() || modelId;
}

export function lovableRequest(url: string, apiKey: string, headers: Headers) {
  const next = new Headers(headers);
  next.delete("Authorization");
  next.set("Lovable-API-Key", apiKey);
  next.set("X-Lovable-AIG-SDK", "vercel-ai-sdk");
  return { url: `${LOVABLE_BASE_URL}${endpointPath(url)}`, headers: next };
}

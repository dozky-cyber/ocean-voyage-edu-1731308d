/**
 * Extracts the OpenAI-compatible endpoint path ("/chat/completions", "/embeddings", …)
 * from a full provider URL, ignoring any provider-specific base prefix
 * (`/v1`, `/v1beta`, `/v1beta/openai`).
 */
export function endpointPath(url: string): string {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  const stripped = pathname.replace(/^.*?\/(?:v1beta|v1)(?:\/openai)?/, "");
  return stripped || "/chat/completions";
}

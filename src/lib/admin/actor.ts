/** Human readable actor label for activity logs, derived from auth claims. */
export function actorName(claims: unknown): string {
  const email =
    claims && typeof claims === "object"
      ? (claims as { email?: unknown }).email
      : undefined;
  if (typeof email === "string" && email.includes("@")) {
    return email.split("@")[0] ?? email;
  }
  return "KERJAKU Team";
}

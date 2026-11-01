/**
 * Returns `value` only if it is a same-site path, so `?next=` can't be used
 * to send people to another domain after signing in.
 */
export function safeNext(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

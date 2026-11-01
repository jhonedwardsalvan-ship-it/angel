import "server-only";
import { headers } from "next/headers";
import { mongoClient } from "@/lib/db/mongo-client";

// Fixed-window rate limits for public server actions, stored in MongoDB so the
// count is shared by every server instance (in-memory counters reset per
// serverless instance). Better Auth's own limiter only sees HTTP requests to
// /api/auth, not auth.api calls made from our server actions.

type Rule = { max: number; windowSeconds: number };

export const LIMITS = {
  signIn: { max: 10, windowSeconds: 5 * 60 },
  signUp: { max: 5, windowSeconds: 60 * 60 },
  placeOrder: { max: 10, windowSeconds: 60 * 60 },
  trackOrder: { max: 15, windowSeconds: 15 * 60 },
} satisfies Record<string, Rule>;

type Doc = { _id: string; count: number; expiresAt: Date };

const collection = () => mongoClient.db().collection<Doc>("rate_limits");

let indexReady: Promise<unknown> | null = null;
function ensureIndex() {
  // TTL index: MongoDB deletes each window's counter once it expires.
  indexReady ??= collection()
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    .catch(() => (indexReady = null));
  return indexReady;
}

/** The visitor's IP. Vercel sets x-forwarded-for itself, so the first entry can be trusted there. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Counts one attempt for `name` from this visitor and returns false once they
 * are over the limit. Fails open if the database is unreachable, so an outage
 * here never blocks real customers.
 */
export async function rateLimit(name: keyof typeof LIMITS, key?: string): Promise<boolean> {
  const rule: Rule = LIMITS[name];
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const id = `${name}:${key ?? (await clientIp())}:${windowStart}`;

  try {
    await ensureIndex();
    const doc = await collection().findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
      { upsert: true, returnDocument: "after" },
    );
    return (doc?.count ?? 1) <= rule.max;
  } catch (error) {
    console.error("rate limit check failed", error);
    return true;
  }
}

import "server-only";
import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

// Native driver client, used by the Better Auth adapter.
// Cached on globalThis so hot reloads in dev don't open new pools.
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export const mongoClient =
  // Small pool per instance; see the note in mongoose.ts.
  globalForMongo.mongoClient ?? new MongoClient(env.MONGODB_URI, { maxPoolSize: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = mongoClient;
}

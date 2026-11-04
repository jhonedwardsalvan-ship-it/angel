import "server-only";
import mongoose from "mongoose";
import { env } from "@/lib/env";

// Mongoose connection for app models. Call `await connectDB()` before
// querying models in route handlers, server actions or server components.
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache };

const cached: MongooseCache = (globalForMongoose.mongoose ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    // Each serverless instance opens its own pool; a small cap keeps many
    // instances under the Atlas connection limit (500 on M0/Flex).
    maxPoolSize: 10,
  });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { mongoClient } from "@/lib/db/mongo-client";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // The client is not passed to the adapter, so transactions are disabled.
  // This keeps it working against a standalone local MongoDB; pass
  // `{ client: mongoClient }` once you run on a replica set (e.g. Atlas).
  database: mongodbAdapter(mongoClient.db()),
  user: {
    additionalFields: {
      // "admin" unlocks /admin. input: false means sign-up and update-user
      // requests can't set it; grant it with `npm run admin:grant <email>`.
      role: { type: "string", required: false, defaultValue: "user", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    // Keep in sync with MIN_PASSWORD in src/lib/auth-actions.ts.
    minPasswordLength: 8,
  },
  socialProviders: env.google
    ? { google: { ...env.google, prompt: "select_account" } }
    : {},
  account: {
    accountLinking: {
      // Default, made explicit: a Google sign-in is not linked to an existing
      // unverified password account with the same email (callback error
      // "account_not_linked"). Blocks takeover of accounts pre-registered with
      // someone else's address. Revisit once email verification exists.
      requireLocalEmailVerified: true,
    },
  },
  // Limits direct requests to /api/auth (on by default in production). Stored in
  // MongoDB so the count is shared by every server instance. Our own server
  // actions are limited separately in src/lib/rate-limit.ts.
  rateLimit: { storage: "database" },
  // Must be the last plugin: lets server actions set auth cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

/** True when Google credentials are configured; shows "Continue with Google". */
export const googleSignInEnabled = env.google !== null;

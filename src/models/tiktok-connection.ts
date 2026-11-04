import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load model files directly.

/**
 * Single document (key "store"): the TikTok account connected in the admin and
 * its Display API tokens. Read-only access (profile + public video list).
 * Never send this document to the browser.
 */
const tiktokConnectionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    openId: { type: String, required: true },
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    accessToken: { type: String, required: true },
    /** TikTok access tokens last 24 hours; refreshed automatically before each call. */
    accessExpiresAt: { type: Date, required: true },
    refreshToken: { type: String, required: true },
    /** Refresh tokens last about a year. After this the admin has to reconnect. */
    refreshExpiresAt: { type: Date, required: true },
    lastSyncAt: { type: Date, default: null },
    /** Set when the last sync failed; cleared by the next successful one. */
    lastSyncError: { type: String, default: "" },
  },
  { timestamps: true },
);

export type TikTokConnectionDoc = InferSchemaType<typeof tiktokConnectionSchema>;

export const TikTokConnection = registerModel("TikTokConnection", tiktokConnectionSchema) as Model<TikTokConnectionDoc>;

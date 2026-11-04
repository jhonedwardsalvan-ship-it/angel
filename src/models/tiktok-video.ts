import { Schema, type InferSchemaType, type Model } from "mongoose";
import { registerModel } from "./register";

// No "server-only" or "@/" imports: scripts may load model files directly.

/**
 * A video from the connected TikTok account. Only the link and details are
 * stored; the video itself plays from TikTok. The sync fills the TikTok fields
 * and never touches the store fields (hidden, product, sortOrder).
 */
const tiktokVideoSchema = new Schema(
  {
    // From TikTok
    videoId: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    shareUrl: { type: String, default: "" },
    postedAt: { type: Date, required: true },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    /**
     * Cover copied to Cloudinary (TikTok's own cover links expire after a few
     * hours). Empty when Cloudinary isn't set up or the copy failed; the next
     * sync tries again.
     */
    coverImage: { type: String, default: "" },
    /** Set when the video was missing from the last full sync (deleted or made private on TikTok). */
    removedAt: { type: Date, default: null },

    // Store fields, edited in the admin
    /** New videos start hidden so nothing appears on the store until an admin picks it. */
    hidden: { type: Boolean, default: true },
    /** "Shop this" product shown under the video. */
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    /** Lower shows first; ties show newest first. */
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

tiktokVideoSchema.index({ hidden: 1, removedAt: 1, sortOrder: 1, postedAt: -1 });

export type TikTokVideoDoc = InferSchemaType<typeof tiktokVideoSchema>;

export const TikTokVideo = registerModel("TikTokVideo", tiktokVideoSchema) as Model<TikTokVideoDoc>;

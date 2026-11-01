"use server";

import { createHash } from "node:crypto";
import { requireAdmin } from "@/lib/session";

// Signed direct uploads to Cloudinary. The browser sends the file straight to
// Cloudinary (no Vercel body-size limit); this action only signs the request,
// so the API secret never leaves the server and only admins can upload.

export type UploadTarget = "products" | "categories";

export type UploadSignature =
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; folder: string; format?: string; signature: string }
  | { ok: false; error: string };

export async function signImageUploadAction(target: UploadTarget, convertToJpg = false): Promise<UploadSignature> {
  await requireAdmin();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, error: "Uploads aren't set up yet. Add the CLOUDINARY_* keys to the environment variables." };
  }
  if (target !== "products" && target !== "categories") return { ok: false, error: "Unknown upload target." };

  const params: Record<string, string | number> = {
    folder: `angel/${target}`,
    timestamp: Math.floor(Date.now() / 1000),
    // iPhone HEIC photos don't display in most browsers; Cloudinary converts them on upload.
    ...(convertToJpg ? { format: "jpg" } : {}),
  };
  // Cloudinary signature: params sorted by name, joined as k=v&k=v, then the secret, SHA-1.
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return {
    ok: true,
    cloudName,
    apiKey,
    timestamp: params.timestamp as number,
    folder: params.folder as string,
    ...(convertToJpg ? { format: "jpg" } : {}),
    signature,
  };
}

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { syncTikTokVideos } from "@/lib/tiktok/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set. */
function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Daily TikTok sync (schedule in vercel.json). */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await syncTikTokVideos();
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/session";
import { connectWithCode, STATE_COOKIE } from "@/lib/tiktok/client";
import { syncTikTokVideos } from "@/lib/tiktok/sync";

export const dynamic = "force-dynamic";
// The first sync copies every cover to Cloudinary, which can take a while.
export const maxDuration = 60;

const back = (key: "notice" | "error", message: string) => redirect(`/admin/tiktok?${key}=${encodeURIComponent(message)}`);

function sameState(a: string, b: string) {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** TikTok sends the admin back here after login. Saves the connection, then runs a first sync. */
export async function GET(request: NextRequest) {
  await requireAdmin("/admin/tiktok");
  const params = request.nextUrl.searchParams;
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete({ name: STATE_COOKIE, path: "/api/tiktok" });

  if (params.get("error")) back("error", `TikTok login was cancelled (${params.get("error_description") || params.get("error")}).`);
  const code = params.get("code");
  const state = params.get("state") ?? "";
  if (!code || !expected || !sameState(state, expected)) back("error", "That TikTok login expired. Try connecting again.");

  try {
    await connectWithCode(code!);
  } catch (e) {
    console.error("TikTok connect failed", e);
    back("error", "Couldn't connect to TikTok. Try again.");
  }

  const result = await syncTikTokVideos();
  if (!result.ok) back("error", `Connected, but the first sync failed: ${result.error}`);
  back("notice", `Connected. Found ${result.ok ? result.total : 0} videos. They stay hidden until you show them below.`);
}

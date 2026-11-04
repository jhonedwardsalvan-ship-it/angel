import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { authorizeUrl, STATE_COOKIE, tiktokConfig } from "@/lib/tiktok/client";

export const dynamic = "force-dynamic";

/** Starts "Connect TikTok": sends the admin to TikTok's login with a one-time state value. */
export async function GET() {
  await requireAdmin("/admin/tiktok");
  if (!tiktokConfig()) {
    redirect(`/admin/tiktok?error=${encodeURIComponent("Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET first.")}`);
  }

  // The callback only accepts a login it can match to this cookie (stops forged callbacks).
  const state = randomBytes(16).toString("hex");
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/tiktok",
    maxAge: 10 * 60,
  });
  redirect(authorizeUrl(state));
}

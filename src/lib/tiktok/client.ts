import "server-only";
import { connectDB } from "@/lib/db/mongoose";
import { env } from "@/lib/env";
import { TikTokConnection } from "@/models/tiktok-connection";

// TikTok Login Kit + Display API (v2). Read-only: the connected account's
// profile and public video list. Docs: developers.tiktok.com/doc/display-api-overview

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const API = "https://open.tiktokapis.com/v2";
export const SCOPES = "user.info.basic,video.list";
/** One-time login state, set by /api/tiktok/connect and checked by /api/tiktok/callback. */
export const STATE_COOKIE = "tiktok_oauth_state";

/** Thrown when TikTok rejects the saved login; the admin has to reconnect. */
export class TikTokAuthError extends Error {}

/**
 * Env value without the stray characters that come along when pasting into
 * Vercel: spaces, line breaks, quotes and invisible zero-width characters.
 * TikTok keys and secrets never contain any of these.
 */
const cleanEnv = (name: string) => process.env[name]?.replace(/[\s"'`​-‍⁠﻿]/g, "");

export function tiktokConfig() {
  const clientKey = cleanEnv("TIKTOK_CLIENT_KEY");
  const clientSecret = cleanEnv("TIKTOK_CLIENT_SECRET");
  return clientKey && clientSecret ? { clientKey, clientSecret } : null;
}

function requireConfig() {
  const cfg = tiktokConfig();
  if (!cfg) throw new Error("TikTok isn't set up. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.");
  return cfg;
}

/** Must match the redirect URI registered in the TikTok developer portal exactly. */
export const redirectUri = () => `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/api/tiktok/callback`;

export function authorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_key: requireConfig().clientKey,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: redirectUri(),
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
};

async function tokenRequest(fields: Record<string, string>): Promise<TokenResponse> {
  const { clientKey, clientSecret } = requireConfig();
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, ...fields }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const message = json.error_description || json.error || `HTTP ${res.status}`;
    // invalid_grant: the code or refresh token is expired or revoked.
    if (json.error === "invalid_grant") throw new TikTokAuthError(message);
    throw new Error(`TikTok token request failed: ${message}`);
  }
  return json as TokenResponse;
}

function tokenFields(t: TokenResponse) {
  const now = Date.now();
  return {
    openId: t.open_id,
    accessToken: t.access_token,
    // A minute early, so a token never expires mid-request.
    accessExpiresAt: new Date(now + (t.expires_in - 60) * 1000),
    refreshToken: t.refresh_token,
    refreshExpiresAt: new Date(now + t.refresh_expires_in * 1000),
  };
}

/** Calls a Display API endpoint. TikTok wraps every reply as { data, error: { code, message } }. */
async function api<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  const code = json?.error?.code;
  if (code === "access_token_invalid" || code === "scope_not_authorized" || res.status === 401) {
    throw new TikTokAuthError(json?.error?.message || "TikTok login is no longer valid.");
  }
  if (!res.ok || (code && code !== "ok")) {
    throw new Error(`TikTok ${path} failed: ${json?.error?.message || code || `HTTP ${res.status}`}`);
  }
  return json.data as T;
}

type UserInfo = { open_id: string; display_name?: string; avatar_url?: string };

async function fetchUser(accessToken: string) {
  const data = await api<{ user: UserInfo }>("/user/info/?fields=open_id,display_name,avatar_url", accessToken);
  return { displayName: data.user.display_name ?? "", avatarUrl: data.user.avatar_url ?? "" };
}

/** Finishes the login: trades the callback code for tokens and saves the connection. */
export async function connectWithCode(code: string) {
  const tokens = tokenFields(await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri() }));
  const profile = await fetchUser(tokens.accessToken);
  await connectDB();
  await TikTokConnection.findOneAndUpdate(
    { key: "store" },
    { ...tokens, ...profile, lastSyncError: "" },
    { upsert: true, runValidators: true },
  );
}

/** A valid access token for the connected account, refreshing it if needed. Null when nothing is connected. */
export async function getAccessToken(): Promise<string | null> {
  await connectDB();
  const conn = await TikTokConnection.findOne({ key: "store" }).lean();
  if (!conn) return null;
  if (conn.accessExpiresAt.getTime() > Date.now()) return conn.accessToken;
  if (conn.refreshExpiresAt.getTime() <= Date.now()) throw new TikTokAuthError("TikTok login expired. Reconnect the account.");

  const tokens = tokenFields(await tokenRequest({ grant_type: "refresh_token", refresh_token: conn.refreshToken }));
  await TikTokConnection.updateOne({ key: "store" }, tokens);
  return tokens.accessToken;
}

/** Signs the store out of TikTok: revokes the token (best effort) and deletes the connection. */
export async function disconnect() {
  await connectDB();
  const conn = await TikTokConnection.findOneAndDelete({ key: "store" }).lean();
  const cfg = tiktokConfig();
  if (!conn || !cfg) return;
  await fetch(`${API}/oauth/revoke/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: cfg.clientKey, client_secret: cfg.clientSecret, token: conn.accessToken }),
  }).catch((e) => console.error("TikTok revoke failed", e));
}

export type TikTokApiVideo = {
  id: string;
  title?: string;
  video_description?: string;
  cover_image_url?: string;
  share_url?: string;
  create_time: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
};

const VIDEO_FIELDS = "id,title,video_description,cover_image_url,share_url,create_time,view_count,like_count,comment_count";

/**
 * The account's public videos, newest first, up to `maxPages` × 20.
 * `complete` is false when there were more than that, so callers know the
 * list isn't the whole account.
 */
export async function listVideos(accessToken: string, maxPages = 10) {
  const videos: TikTokApiVideo[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < maxPages; page++) {
    const data = await api<{ videos: TikTokApiVideo[]; cursor: number; has_more: boolean }>(
      `/video/list/?fields=${VIDEO_FIELDS}`,
      accessToken,
      { method: "POST", body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }) },
    );
    videos.push(...(data.videos ?? []));
    if (!data.has_more) return { videos, complete: true };
    cursor = data.cursor;
  }
  return { videos, complete: false };
}

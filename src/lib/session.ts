import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/** Current session or null. Cached per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** Session for pages that need a signed-in customer; otherwise redirects to /login. */
export async function requireSession(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

/**
 * Session for admin pages and admin server actions. Signed-out visitors go to
 * /admin/login; signed-in non-admins get a 404 so the admin area isn't
 * advertised. Call it in every admin page AND every admin action — layouts
 * alone don't protect server actions.
 */
export async function requireAdmin(returnTo = "/admin") {
  const session = await getSession();
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  if (session.user.role !== "admin") notFound();
  return session;
}

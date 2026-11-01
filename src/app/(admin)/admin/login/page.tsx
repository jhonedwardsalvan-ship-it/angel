import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoBadge } from "@/components/layout/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin sign in · AL",
  robots: { index: false },
};

// Admin accounts are created by `npm run db:seed-admin`; there is no
// self-registration here on purpose.
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const raw = (await searchParams).next;
  const next = typeof raw === "string" && /^\/admin(\/|$|\?)/.test(raw) ? raw : "/admin";
  const session = await getSession();
  if (session?.user.role === "admin") redirect(next);

  return (
    <main className="flex flex-1 items-center bg-surface py-12">
      <div className="container-narrow stack gap-8">
        <header className="stack items-center gap-2 text-center">
          <LogoBadge className="size-28" />
          <p className="eyebrow">Admin</p>
          <h1 className="text-h4 text-ink-muted">Sign in to manage the store</h1>
        </header>
        <div className="panel">
          <AdminLoginForm next={next} />
        </div>
        <p className="text-center text-sm text-ink-muted">
          <Link href="/" className="link-quiet">← Back to the store</Link>
        </p>
      </div>
    </main>
  );
}

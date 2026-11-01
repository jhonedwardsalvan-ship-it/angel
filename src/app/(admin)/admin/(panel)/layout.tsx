import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { adminSignOutAction } from "@/lib/admin/auth-actions";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { template: "%s · Angel admin", default: "Admin · Angel" },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

// The layout check is for UX only: every admin page and server action calls
// requireAdmin() itself, because layouts don't guard actions or partial renders.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="text-h4 tracking-[0.2em] uppercase">Angel</span>
            <span className="eyebrow">Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-muted md:inline">{user.email}</span>
            <Link href="/" className="link-quiet">View store</Link>
            <form action={adminSignOutAction}>
              <button type="submit" className="link-quiet">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-page grid flex-1 gap-6 py-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AdminNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

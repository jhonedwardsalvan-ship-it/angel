import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { signOutAction } from "@/lib/auth-actions";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account · Angel",
  robots: { index: false },
};

const memberSince = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" });

export default async function AccountPage() {
  const { user } = await requireSession("/account");

  return (
    <div className="container-prose pt-4 pb-(--section-y) md:pt-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />

      <header className="stack mb-8 gap-3 md:mb-10">
        <p className="eyebrow">Your account</p>
        <h1 className="text-h2">Hello, {user.name}</h1>
      </header>

      <div className="panel stack gap-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="stack gap-1">
            <dt className="eyebrow">Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="stack gap-1">
            <dt className="eyebrow">Email</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div className="stack gap-1">
            <dt className="eyebrow">Member since</dt>
            <dd>{memberSince.format(new Date(user.createdAt))}</dd>
          </div>
        </dl>

        <hr className="divider" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Continue shopping
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-outline w-full sm:w-auto">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

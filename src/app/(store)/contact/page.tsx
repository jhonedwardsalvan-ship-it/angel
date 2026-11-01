import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { getStoreSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us · AL",
  description: "Call, text or message AL Flower Shop.",
};

export default async function ContactPage() {
  const { leadDays } = await getStoreSettings();

  return (
    <ProsePage title="Contact us" eyebrow="Help">
      <p>
        Questions about an order, a custom arrangement or payment? We&apos;re happy to help. Please book at least{" "}
        {leadDays} days ahead of your date; we don&apos;t take rush orders.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel stack gap-3">
          <h2 className="!mb-0">Call or text</h2>
          <a href={SITE.phoneHref} className="text-h3 text-ink tabular-nums">{SITE.phone}</a>
          <div className="flex flex-wrap gap-2">
            <a href={SITE.phoneHref} className="btn btn-primary btn-sm">Call</a>
            <a href={SITE.smsHref} className="btn btn-outline btn-sm">Text</a>
          </div>
        </section>

        <section className="panel stack gap-3">
          <h2 className="!mb-0">Message us</h2>
          <ul className="!gap-3">
            {SITE.socials.map((s) => (
              <li key={s.label} className="!ml-0 !list-none">
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="link text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2>Email</h2>
        {SITE.email ? (
          <a href={`mailto:${SITE.email}`} className="link">{SITE.email}</a>
        ) : (
          <p>Coming soon. For now, please call, text or message us.</p>
        )}
      </section>

      <section>
        <h2>Already ordered?</h2>
        <p>
          <Link href="/orders" className="link">Track your order</Link> with your order number and phone number.
        </p>
      </section>
    </ProsePage>
  );
}

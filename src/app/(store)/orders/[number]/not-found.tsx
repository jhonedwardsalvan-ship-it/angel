import Link from "next/link";
import { SITE } from "@/lib/site";

/** An order that doesn't exist, or that this browser hasn't unlocked with a lookup. */
export default function OrderNotFound() {
  return (
    <div className="container-narrow stack items-center gap-4 py-20 text-center">
      <p className="eyebrow">Track an order</p>
      <h1 className="text-h2">We couldn&apos;t open this order</h1>
      <p className="text-ink-muted">
        Look it up with your order number and the phone number you used at checkout. Need help? Call or text{" "}
        <a href={SITE.phoneHref} className="link">{SITE.phone}</a>.
      </p>
      <Link href="/orders" className="btn btn-primary mt-2">Look up my order</Link>
    </div>
  );
}

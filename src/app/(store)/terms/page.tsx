import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms · AL",
  description: "How ordering, payment, delivery and cancellations work at AL Flower Shop.",
};

export default async function TermsPage() {
  const { leadDays, deliveryFee, freeDeliveryMin } = await getStoreSettings();

  return (
    <ProsePage title="Terms of service" eyebrow="Terms" updated="November 1, 2026">
      <p>
        These terms apply to every order placed with {SITE.name} through this website. By placing an order you
        agree to them. Please read them carefully, especially the sections on payment and cancellations.
      </p>

      <section>
        <h2>1. Placing an order</h2>
        <p>
          Placing an order on this website sends us an <strong>order request</strong>. It is not paid yet, and we do
          not take any payment on the website. You&apos;ll receive an order number on the confirmation page. Keep it
          to track your order.
        </p>
      </section>

      <section>
        <h2>2. Payment comes first</h2>
        <ul>
          <li>After you place your order, our team will contact you at the phone number you gave to arrange payment.</li>
          <li><strong>We start preparing your order only after payment is confirmed.</strong></li>
          <li>If we can&apos;t reach you or payment isn&apos;t completed in time for your delivery date, we may release the order.</li>
        </ul>
      </section>

      <section>
        <h2>3. Booking in advance</h2>
        <ul>
          <li>Orders must be booked <strong>at least {leadDays} days before</strong> the delivery date. We recommend 3–5 days.</li>
          <li><strong>We don&apos;t accept rush orders.</strong> The earliest date you can choose at checkout already reflects this.</li>
        </ul>
      </section>

      <section>
        <h2>4. No cancellations, no refunds</h2>
        <p>
          Once your order is booked, it <strong>cannot be cancelled</strong>, and payments are{" "}
          <strong>non-refundable</strong>. We make each piece by hand for your date, so we can&apos;t
          resell it. Please double-check the date, time and recipient details before placing your order.
        </p>
      </section>

      <section>
        <h2>5. Delivery</h2>
        <ul>
          <li>
            Delivery costs {formatPrice(deliveryFee)}
            {freeDeliveryMin > 0 && <>, and is free for orders of {formatPrice(freeDeliveryMin)} or more</>}. The fee for
            your order is shown at checkout.
          </li>
          <li>We deliver within the time slot you choose. Times are estimates and can be affected by traffic and weather.</li>
          <li>
            You&apos;re responsible for giving us a correct recipient name, address and contact details. If the recipient
            isn&apos;t available, we&apos;ll try to contact you or leave the order with someone at the address.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Handmade items and substitutions</h2>
        <p>
          Every piece is made by hand, so colours, sizes and shapes can differ slightly from the photos. If a material
          or colour isn&apos;t available, we may use one of similar style and equal or greater value.
        </p>
      </section>

      <section>
        <h2>7. Prices</h2>
        <p>
          Prices are in Philippine pesos (₱). The total on your order confirmation is the amount you&apos;ll pay. We may
          change prices on the website at any time, but that never affects an order you&apos;ve already placed.
        </p>
      </section>

      <section>
        <h2>8. Your information</h2>
        <p>
          We use your details only to process and deliver your order. See our{" "}
          <Link href="/privacy" className="link">Privacy policy</Link>.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Questions about an order? Call or text <a href={SITE.phoneHref} className="link">{SITE.phone}</a>, or message us
          on any of our <Link href="/contact" className="link">social pages</Link>.
        </p>
      </section>
    </ProsePage>
  );
}

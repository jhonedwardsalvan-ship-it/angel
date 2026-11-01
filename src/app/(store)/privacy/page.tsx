import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy · AL",
  description: "What personal information AL Flower Shop collects and how it is used.",
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" eyebrow="Privacy" updated="November 1, 2026">
      <p>
        {SITE.name} respects your privacy. This policy explains what personal information we collect, why we collect
        it and how we protect it, in line with the Data Privacy Act of 2012 (Republic Act No. 10173).
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Your details:</strong> name, phone number and email address.</li>
          <li><strong>Delivery details:</strong> recipient&apos;s name, delivery address, date and time slot.</li>
          <li><strong>Card message:</strong> the note you ask us to include with the flowers.</li>
          <li><strong>Account details:</strong> if you create an account, your name, email and sign-in information.</li>
          <li><strong>Order history:</strong> what you ordered, totals and order status.</li>
        </ul>
        <p className="mt-3">We don&apos;t collect card or bank details on this website. Payment is arranged directly with our team.</p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To prepare and deliver your order.</li>
          <li>To contact you about payment, delivery and any issue with your order.</li>
          <li>To let you track your order and see your past orders.</li>
          <li>To keep records required for our business and the law.</li>
        </ul>
        <p className="mt-3">We don&apos;t sell your information, and we don&apos;t use it for advertising without your consent.</p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>
          Only with people who need it to complete your order: for example, the rider or courier who delivers it
          (recipient name, address and contact number). We may also disclose information when the law requires it.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use a few essential cookies to keep your cart, keep you signed in, show your order confirmation and remember
          orders you&apos;ve looked up. We don&apos;t use advertising cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep order information for as long as we need it for the order and for our business records, then delete
          or anonymize it. You can ask us to delete your account at any time.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under the Data Privacy Act you have the right to be informed, to access your information, to have it corrected,
          to object to its processing and to have it erased or blocked. To use any of these rights, contact us below.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          For privacy questions or requests, call or text <a href={SITE.phoneHref} className="link">{SITE.phone}</a>
          {SITE.email && (
            <>
              {" "}or email <a href={`mailto:${SITE.email}`} className="link">{SITE.email}</a>
            </>
          )}
          . You can also reach us on our <Link href="/contact" className="link">social pages</Link>.
        </p>
      </section>
    </ProsePage>
  );
}

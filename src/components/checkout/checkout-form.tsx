"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { placeOrderAction, type CheckoutField } from "@/lib/checkout/actions";
import { DELIVERY_SLOTS } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";

type CheckoutFormProps = {
  total: number;
  minDate: string;
  maxDate: string;
  /** Minimum days between today and the delivery date. */
  leadDays: number;
  /** Prefill from the signed-in account. */
  defaults: { name?: string; email?: string };
};

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="stack gap-5 border-b border-line pb-8">
      <legend className="mb-5 text-h4">{legend}</legend>
      {children}
    </fieldset>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="text-sm text-danger">{message}</p> : null;
}

export function CheckoutForm({ total, minDate, maxDate, leadDays, defaults }: CheckoutFormProps) {
  const [state, action, pending] = useActionState(placeOrderAction, undefined);
  const v = (f: CheckoutField) => state?.values?.[f];
  const e = (f: CheckoutField) => state?.fieldErrors?.[f];

  return (
    <form action={action} noValidate className="stack gap-8">
      <FormAlert message={state?.error} />

      <Fieldset legend="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Your name" name="name" autoComplete="name" required defaultValue={v("name") ?? defaults.name} error={e("name")} />
          <FormField label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="0917 123 4567" defaultValue={v("phone")} error={e("phone")} />
        </div>
        <FormField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required hint="For your order records." defaultValue={v("email") ?? defaults.email} error={e("email")} />
      </Fieldset>

      <Fieldset legend="Delivery">
        <FormField label="Recipient's name" name="recipientName" autoComplete="off" required defaultValue={v("recipientName")} error={e("recipientName")} />
        <FormField label="Address" name="address" autoComplete="street-address" required placeholder="House no., street, barangay" defaultValue={v("address")} error={e("address")} />
        <FormField label="City" name="city" autoComplete="address-level2" required defaultValue={v("city")} error={e("city")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Delivery date" name="deliveryDate" type="date" required min={minDate} max={maxDate} defaultValue={v("deliveryDate") ?? minDate} error={e("deliveryDate")} hint={`At least ${leadDays} days from today. No rush orders.`} />
          <div className="stack gap-2">
            <label htmlFor="field-deliverySlot" className="text-sm">Delivery time</label>
            <select
              id="field-deliverySlot"
              name="deliverySlot"
              className="input"
              defaultValue={v("deliverySlot") ?? "afternoon"}
              aria-invalid={e("deliverySlot") ? true : undefined}
              aria-describedby={e("deliverySlot") ? "field-deliverySlot-error" : undefined}
            >
              {Object.entries(DELIVERY_SLOTS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ErrorText id="field-deliverySlot-error" message={e("deliverySlot")} />
          </div>
        </div>
        <div className="stack gap-2">
          <label htmlFor="field-cardMessage" className="text-sm">
            Message card <span className="text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="field-cardMessage"
            name="cardMessage"
            rows={3}
            maxLength={200}
            className="input resize-y"
            placeholder="Happy birthday! Love, Ana"
            defaultValue={v("cardMessage")}
            aria-invalid={e("cardMessage") ? true : undefined}
            aria-describedby="field-cardMessage-hint"
          />
          {e("cardMessage") ? (
            <ErrorText id="field-cardMessage-hint" message={e("cardMessage")} />
          ) : (
            <p id="field-cardMessage-hint" className="text-xs text-ink-muted">Handwritten and tucked into the wrap. Up to 200 characters.</p>
          )}
        </div>
        <div className="stack gap-2">
          <label htmlFor="field-notes" className="text-sm">
            Notes <span className="text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="field-notes"
            name="notes"
            rows={4}
            maxLength={5000}
            className="input resize-y"
            placeholder="e.g. Add a name tag, mix pink and white flowers, or use a bigger wrapper"
            defaultValue={v("notes")}
            aria-invalid={e("notes") ? true : undefined}
            aria-describedby="field-notes-hint"
          />
          {e("notes") ? (
            <ErrorText id="field-notes-hint" message={e("notes")} />
          ) : (
            <p id="field-notes-hint" className="text-xs text-ink-muted">Tell us how you&apos;d like your order customized. Our team will contact you to go over the details.</p>
          )}
        </div>
      </Fieldset>

      <section aria-labelledby="payment-title" className="stack gap-4">
        <h2 id="payment-title" className="text-h4">Payment</h2>
        <div className="stack gap-2 rounded-card bg-surface p-4 text-sm md:p-5">
          <p>
            <strong className="font-medium">No payment on this site.</strong> After you place your
            order, our team will contact you at the phone number above to arrange payment.
          </p>
          <p className="text-ink-muted">
            We start preparing your flowers once payment is confirmed. Orders are booked at least{" "}
            {leadDays} days ahead, and there are no cancellations or refunds.
          </p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="agreeTerms"
            required
            defaultChecked={v("agreeTerms") === "on"}
            aria-invalid={e("agreeTerms") ? true : undefined}
            aria-describedby={e("agreeTerms") ? "field-agreeTerms-error" : undefined}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="link">Terms</Link>, including{" "}
            <strong className="font-medium">no cancellation and no refund</strong> once my order is booked.
          </span>
        </label>
        <ErrorText id="field-agreeTerms-error" message={e("agreeTerms")} />
      </section>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Placing order…" : `Place order request · ${formatPrice(total)}`}
      </button>
    </form>
  );
}

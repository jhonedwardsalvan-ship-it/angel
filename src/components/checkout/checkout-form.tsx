"use client";

import { useActionState, useState, type ReactNode } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { placeOrderAction, type CheckoutField } from "@/lib/checkout/actions";
import { DELIVERY_SLOTS, PAYMENT_METHODS } from "@/lib/checkout/delivery";
import { formatPrice } from "@/lib/format";

type CheckoutFormProps = {
  total: number;
  minDate: string;
  maxDate: string;
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

export function CheckoutForm({ total, minDate, maxDate, defaults }: CheckoutFormProps) {
  const [state, action, pending] = useActionState(placeOrderAction, undefined);
  const [payment, setPayment] = useState<keyof typeof PAYMENT_METHODS>("demo-card");
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
        <FormField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required hint="We'll send your order confirmation here." defaultValue={v("email") ?? defaults.email} error={e("email")} />
      </Fieldset>

      <Fieldset legend="Delivery">
        <FormField label="Recipient's name" name="recipientName" autoComplete="off" required defaultValue={v("recipientName")} error={e("recipientName")} />
        <FormField label="Address" name="address" autoComplete="street-address" required placeholder="House no., street, barangay" defaultValue={v("address")} error={e("address")} />
        <FormField label="City" name="city" autoComplete="address-level2" required defaultValue={v("city")} error={e("city")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Delivery date" name="deliveryDate" type="date" required min={minDate} max={maxDate} defaultValue={v("deliveryDate") ?? minDate} error={e("deliveryDate")} />
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
      </Fieldset>

      <fieldset className="stack gap-4">
        <legend className="mb-1 text-h4">Payment</legend>
        <p className="rounded-control border border-dashed border-line-strong px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">Demo checkout.</strong> No payment is taken and no
          card details are collected. Placing an order only shows a confirmation.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
            <label key={value} className="chip min-h-14 justify-start gap-3 rounded-control px-4">
              <input
                type="radio"
                name="paymentMethod"
                value={value}
                checked={payment === value}
                onChange={() => setPayment(value as keyof typeof PAYMENT_METHODS)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
        {payment === "demo-card" && (
          // Display only: these inputs have no name, so nothing is ever submitted.
          <div className="panel stack gap-4 bg-surface" aria-label="Demo card details">
            <div className="stack gap-2">
              <span className="text-sm">Card number</span>
              <input className="input tabular-nums" value="4242 4242 4242 4242" readOnly aria-label="Demo card number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="stack gap-2">
                <span className="text-sm">Expiry</span>
                <input className="input" value="12 / 34" readOnly aria-label="Demo expiry" />
              </div>
              <div className="stack gap-2">
                <span className="text-sm">CVC</span>
                <input className="input" value="123" readOnly aria-label="Demo CVC" />
              </div>
            </div>
          </div>
        )}
        <ErrorText id="field-paymentMethod-error" message={e("paymentMethod")} />
      </fieldset>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Placing order…" : `Place order · ${formatPrice(total)}`}
      </button>
    </form>
  );
}

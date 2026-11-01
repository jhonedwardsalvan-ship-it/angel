"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { trackOrderAction } from "@/lib/orders/actions";

export function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrderAction, undefined);

  return (
    <form action={action} noValidate className="stack gap-5">
      <FormAlert message={state?.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Order number" name="number" required autoComplete="off" autoCapitalize="characters" placeholder="AL-XXXXXXXX-XXXX" defaultValue={state?.values?.number} />
        <FormField label="Phone used at checkout" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="0917 123 4567" defaultValue={state?.values?.phone} />
      </div>
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Looking up…" : "Track order"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { adminSignInAction } from "@/lib/admin/auth-actions";

export function AdminLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(adminSignInAction, undefined);

  return (
    <form action={action} noValidate className="stack gap-5">
      <input type="hidden" name="next" value={next} />
      <FormAlert message={state?.error} />
      <FormField label="Email" name="email" type="email" autoComplete="username" inputMode="email" required defaultValue={state?.values?.email} error={state?.fieldErrors?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required error={state?.fieldErrors?.password} />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

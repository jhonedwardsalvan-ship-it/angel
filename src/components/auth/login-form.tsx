"use client";

import { useActionState } from "react";
import { signInAction } from "@/lib/auth-actions";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";

type LoginFormProps = {
  next: string;
  /** Message from a failed redirect flow (e.g. Google); cleared on the next submit. */
  initialError?: string;
};

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <form action={action} noValidate className="stack gap-5">
      <input type="hidden" name="next" value={next} />
      <FormAlert message={state ? state.error : initialError} />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.password}
      />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

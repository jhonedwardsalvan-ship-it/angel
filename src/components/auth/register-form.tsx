"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "@/lib/auth-actions";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpAction, undefined);
  const loginHref = `/login?next=${encodeURIComponent(next)}`;

  return (
    <form action={action} noValidate className="stack gap-5">
      <input type="hidden" name="next" value={next} />
      <FormAlert message={state?.error} />
      <FormField
        label="Name"
        name="name"
        autoComplete="name"
        required
        defaultValue={state?.values?.name}
        error={state?.fieldErrors?.name}
      />
      <div className="stack gap-2">
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
        {state?.emailTaken && (
          <Link href={loginHref} className="link w-fit text-sm">
            Sign in instead
          </Link>
        )}
      </div>
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        error={state?.fieldErrors?.password}
      />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

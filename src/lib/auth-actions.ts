"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";

export type AuthField = "name" | "email" | "password";

export type AuthFormState =
  | {
      /** Form-level message shown above the fields. */
      error?: string;
      fieldErrors?: Partial<Record<AuthField, string>>;
      /** Set when registration fails because the email already has an account. */
      emailTaken?: boolean;
      /** Echoed back so fields keep their values after an error. */
      values?: { name?: string; email?: string };
    }
  | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isRateLimited(error: unknown) {
  return isAPIError(error) && error.statusCode === 429;
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email").trim();
  const password = text(formData, "password");
  const next = safeNext(formData.get("next"));
  const values = { email };

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (isRateLimited(error)) return { error: "Too many attempts. Please wait a minute and try again.", values };
    // Same message for unknown email and wrong password, so accounts can't be probed.
    if (isAPIError(error)) return { error: "Incorrect email or password.", values };
    throw error;
  }

  redirect(next);
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = text(formData, "name").trim();
  const email = text(formData, "email").trim();
  const password = text(formData, "password");
  const next = safeNext(formData.get("next"));
  const values = { name, email };

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < MIN_PASSWORD) fieldErrors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (password.length > MAX_PASSWORD) fieldErrors.password = `Use at most ${MAX_PASSWORD} characters.`;
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    // autoSignIn (Better Auth default) sets the session cookie on success.
    await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
  } catch (error) {
    if (isRateLimited(error)) return { error: "Too many attempts. Please wait a minute and try again.", values };
    if (isAPIError(error)) {
      const code = (error.body as { code?: string } | undefined)?.code ?? "";
      if (code.startsWith("USER_ALREADY_EXISTS")) {
        return {
          emailTaken: true,
          fieldErrors: { email: "An account with this email already exists." },
          values,
        };
      }
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        return { fieldErrors: { password: `Use ${MIN_PASSWORD}–${MAX_PASSWORD} characters.` }, values };
      }
      return { error: "We couldn't create your account. Please try again.", values };
    }
    throw error;
  }

  redirect(next);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const { url } = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: next,
      newUserCallbackURL: next,
      // Better Auth appends `&error=<code>`; /login turns it into a message.
      errorCallbackURL: `/login?next=${encodeURIComponent(next)}`,
    },
    headers: await headers(),
  });
  if (!url) throw new Error("Better Auth did not return a Google authorization URL");
  redirect(url);
}

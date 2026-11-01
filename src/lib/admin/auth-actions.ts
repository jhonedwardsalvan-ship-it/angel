"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { mongoClient } from "@/lib/db/mongo-client";

export type AdminSignInState =
  | { error?: string; fieldErrors?: Partial<Record<"email" | "password", string>>; values?: { email?: string } }
  | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Incorrect email or password.";

/** Only same-site /admin paths are allowed as the post-login destination. */
function adminNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^\/admin(\/|$|\?)/.test(value) && !value.startsWith("//") ? value : "/admin";
}

/**
 * Admin sign-in. Checks the account is an admin *before* creating a session,
 * so customer accounts never get signed in here. Errors are identical for
 * unknown emails, wrong passwords and non-admin accounts.
 */
export async function adminSignInAction(_prev: AdminSignInState, formData: FormData): Promise<AdminSignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = adminNext(formData.get("next"));
  const values = { email };

  const fieldErrors: NonNullable<AdminSignInState>["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const admin = await mongoClient.db().collection("user").findOne({ email, role: "admin" }, { projection: { _id: 1 } });
  if (!admin) return { error: GENERIC_ERROR, values };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (isAPIError(error)) {
      return {
        error: error.statusCode === 429 ? "Too many attempts. Please wait a minute and try again." : GENERIC_ERROR,
        values,
      };
    }
    throw error;
  }
  redirect(next);
}

export async function adminSignOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/admin/login");
}

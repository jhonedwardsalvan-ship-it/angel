import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SocialSignInSlot } from "@/components/auth/social-sign-in-slot";
import { safeNext } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in · Angel",
  robots: { index: false },
};

/** Copy for `?error=` codes Better Auth adds when a Google sign-in fails. */
function oauthErrorMessage(code: unknown) {
  if (typeof code !== "string" || !code) return undefined;
  switch (code) {
    case "account_not_linked":
      return "This email already has a password account. Sign in with your password instead.";
    case "access_denied":
      return "Google sign-in was cancelled.";
    default:
      return "We couldn't sign you in with Google. Please try again.";
  }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      description="Sign in to check out faster and see your account."
      footer={
        <>
          New here?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="link">
            Create an account
          </Link>
        </>
      }
    >
      <div className="stack gap-5">
        <SocialSignInSlot next={next} />
        <LoginForm next={next} initialError={oauthErrorMessage(params.error)} />
      </div>
    </AuthShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { SocialSignInSlot } from "@/components/auth/social-sign-in-slot";
import { safeNext } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create an account · AL",
  robots: { index: false },
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <AuthShell
      eyebrow="Join AL"
      title="Create an account"
      description="Save your details for faster checkout and keep track of your gifts."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="link">
            Sign in
          </Link>
        </>
      }
    >
      <div className="stack gap-5">
        <SocialSignInSlot next={next} />
        <RegisterForm next={next} />
      </div>
    </AuthShell>
  );
}

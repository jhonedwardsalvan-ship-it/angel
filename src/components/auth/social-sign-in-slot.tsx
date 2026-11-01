import { googleSignInEnabled } from "@/lib/auth";
import { SocialSignIn } from "./social-sign-in";

/**
 * Shows "Continue with Google" when credentials are configured. In development
 * it explains why the button is missing instead of silently hiding it.
 */
export function SocialSignInSlot({ next }: { next: string }) {
  if (googleSignInEnabled) return <SocialSignIn next={next} />;
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <p className="rounded-control border border-dashed border-line-strong px-4 py-3 text-xs text-ink-muted">
      <strong className="font-medium text-ink">Dev note:</strong> Google sign-in is hidden
      because <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> aren&apos;t set
      in <code>.env.local</code>. See <code>.env.example</code>. Only visible in development.
    </p>
  );
}

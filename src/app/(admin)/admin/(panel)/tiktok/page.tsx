import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { TikTokVideoManager } from "@/components/admin/tiktok-video-manager";
import { disconnectTikTokAction, syncTikTokAction } from "@/lib/admin/actions/tiktok";
import { listProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import { redirectUri } from "@/lib/tiktok/client";
import { getTikTokStatus, listTikTokVideos, type TikTokStatus } from "@/lib/tiktok/queries";

export const metadata = { title: "TikTok" };

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

function AccountPanel({ status }: { status: TikTokStatus }) {
  if (!status.configured) {
    return (
      <section className="panel stack mb-8 gap-2 text-sm">
        <h2 className="text-h4">Set up TikTok</h2>
        <p className="text-ink-muted">
          Create an app at developers.tiktok.com with Login Kit and the Display API (scopes user.info.basic and video.list).
          Add this redirect URI to the app:
        </p>
        <code className="rounded-control bg-surface px-2 py-1 break-all">{redirectUri()}</code>
        {!redirectUri().startsWith("https://") && (
          <p className="text-danger">
            TikTok only accepts https addresses. This shows your local address because BETTER_AUTH_URL isn&apos;t https here;
            register your live site&apos;s address instead, e.g. https://www.your-domain/api/tiktok/callback.
          </p>
        )}
        <p className="text-ink-muted">Then add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to the environment variables and redeploy.</p>
      </section>
    );
  }

  const { account } = status;
  if (!account) {
    return (
      <section className="panel stack mb-8 gap-3 text-sm">
        <h2 className="text-h4">Connect your TikTok account</h2>
        <p className="text-ink-muted">The store reads your public videos once a day. Nothing is posted to TikTok.</p>
        {/* A plain link: the connect route redirects to TikTok's login page. */}
        <a href="/api/tiktok/connect" className="btn btn-primary btn-sm self-start">Connect TikTok</a>
        {/* For checking against the TikTok portal. Both are public: TikTok's login URL shows them anyway. */}
        <dl className="grid gap-1 text-xs text-ink-muted sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
          <dt>Client key in use</dt>
          <dd><code className="break-all">{status.clientKey}</code> ({status.clientKey.length} characters)</dd>
          <dt>Redirect URI</dt>
          <dd><code className="break-all">{redirectUri()}</code></dd>
        </dl>
      </section>
    );
  }

  return (
    <section className="panel stack mb-8 gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        {account.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- TikTok avatar host isn't in next.config images
          <img src={account.avatarUrl} alt="" className="size-10 rounded-pill object-cover" />
        )}
        <div className="stack gap-0.5">
          <p className="font-medium">{account.displayName || "TikTok account"}</p>
          <p className="text-ink-muted">
            {account.lastSyncAt ? `Last synced ${formatDateTime(account.lastSyncAt)}. Syncs daily.` : "Not synced yet."}
          </p>
        </div>
      </div>
      {(account.expired || account.lastSyncError) && (
        <p className="text-danger">
          {account.expired ? "The TikTok login expired." : `Last sync failed: ${account.lastSyncError}`}{" "}
          <a href="/api/tiktok/connect" className="link">Reconnect</a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <form action={syncTikTokAction}>
          <button type="submit" className="btn btn-outline btn-sm">Sync now</button>
        </form>
        <form action={disconnectTikTokAction}>
          <button type="submit" className="link text-danger">Disconnect</button>
        </form>
      </div>
    </section>
  );
}

export default async function AdminTikTokPage({ searchParams }: PageProps<"/admin/tiktok">) {
  await requireAdmin("/admin/tiktok");
  const [params, status, videos, products] = await Promise.all([
    searchParams,
    getTikTokStatus(),
    listTikTokVideos(),
    listProducts({ status: "active" }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="TikTok"
        description="Pick videos in “All videos”, then drag them into order in “On store” and link a product for a “Shop this” button. Changes save right away."
      />
      <Flash notice={params.notice} error={params.error} />
      <AccountPanel status={status} />

      {videos.length === 0 ? (
        status.account && <p className="panel text-sm text-ink-muted">No videos yet. Press “Sync now” after posting on TikTok.</p>
      ) : (
        // Keyed so a sync (which reloads the page with new videos) resets the manager's list.
        <TikTokVideoManager key={`${status.account?.lastSyncAt}-${videos.length}`} videos={videos} products={products} />
      )}
    </div>
  );
}

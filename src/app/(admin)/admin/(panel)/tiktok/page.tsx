import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { disconnectTikTokAction, saveTikTokVideoAction, syncTikTokAction } from "@/lib/admin/actions/tiktok";
import { listProducts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/session";
import { redirectUri } from "@/lib/tiktok/client";
import { getTikTokStatus, listTikTokVideos, type AdminTikTokVideo, type TikTokStatus } from "@/lib/tiktok/queries";

export const metadata = { title: "TikTok" };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

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

function VideoRow({ video, products }: { video: AdminTikTokVideo; products: { id: string; name: string }[] }) {
  return (
    <li className={`panel grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)] ${video.hidden || video.removed ? "opacity-80" : ""}`}>
      <div className="relative aspect-9/16 w-20 overflow-hidden rounded-control bg-surface-strong">
        {video.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview
          <img src={video.coverImage} alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </div>
      <div className="stack min-w-0 gap-2">
        <div className="stack gap-0.5">
          <p className="line-clamp-2 text-sm">{video.title || "Untitled video"}</p>
          <p className="text-xs text-ink-muted">
            {formatDate(video.postedAt)} · {compact(video.viewCount)} views · {compact(video.likeCount)} likes ·{" "}
            {compact(video.commentCount)} comments
            {video.shareUrl && (
              <>
                {" · "}
                <a href={video.shareUrl} target="_blank" rel="noopener noreferrer" className="link">Open on TikTok</a>
              </>
            )}
          </p>
          {video.removed && <p className="text-xs text-danger">No longer on TikTok, so it isn&apos;t shown on the store.</p>}
        </div>
        <form action={saveTikTokVideoAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_auto_auto] sm:items-center">
          <input type="hidden" name="id" value={video.id} />
          <select name="productId" defaultValue={video.productId} aria-label="Shop this product" className="input py-2 text-sm">
            <option value="">No product linked</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" name="sortOrder" defaultValue={video.sortOrder} aria-label="Position" title="Position (lower shows first)" className="input py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="show" defaultChecked={!video.hidden} className="size-4 accent-primary" />
            Show on store
          </label>
          <button type="submit" className="btn btn-outline btn-sm">Save</button>
        </form>
      </div>
    </li>
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
        description="Videos from your TikTok account. Tick “Show on store” for the ones to feature on the home page, and link a product for a “Shop this” button."
      />
      <Flash notice={params.notice} error={params.error} />
      <AccountPanel status={status} />

      {videos.length === 0 ? (
        status.account && <p className="panel text-sm text-ink-muted">No videos yet. Press “Sync now” after posting on TikTok.</p>
      ) : (
        <ul className="stack gap-3">
          {videos.map((v) => <VideoRow key={v.id} video={v} products={products} />)}
        </ul>
      )}
    </div>
  );
}

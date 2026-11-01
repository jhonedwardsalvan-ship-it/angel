import { Flash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin("/admin/settings");
  const [params, settings] = await Promise.all([searchParams, getStoreSettings()]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Delivery pricing and the highlights shown on product pages." />
      <Flash notice={params.notice} error={params.error} />
      <SettingsForm settings={settings} />
    </div>
  );
}

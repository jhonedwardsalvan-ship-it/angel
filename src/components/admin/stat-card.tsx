import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger";
};

export function StatCard({ label, value, hint, href, tone = "default" }: StatCardProps) {
  const valueColor = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink";
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className={`text-h2 tabular-nums ${valueColor}`}>{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="panel stack gap-2 transition-colors hover:border-line-strong">{body}</Link>
  ) : (
    <div className="panel stack gap-2">{body}</div>
  );
}

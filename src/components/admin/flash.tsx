import { FormAlert } from "@/components/forms/form-alert";

/** Shows ?notice= / ?error= messages set by admin redirects. */
export function Flash({ notice, error }: { notice?: unknown; error?: unknown }) {
  const n = typeof notice === "string" ? notice : undefined;
  const e = typeof error === "string" ? error : undefined;
  if (!n && !e) return null;
  return (
    <div className="mb-6">
      {e ? <FormAlert message={e} /> : <p role="status" className="notice">{n}</p>}
    </div>
  );
}

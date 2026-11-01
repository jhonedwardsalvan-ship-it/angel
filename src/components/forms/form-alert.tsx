/** Form-level error banner, announced to screen readers when it appears. */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

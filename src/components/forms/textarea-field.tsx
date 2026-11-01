import type { TextareaHTMLAttributes } from "react";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
};

/** Labelled textarea, wired like FormField. */
export function TextareaField({ label, name, hint, error, rows = 4, ...props }: TextareaFieldProps) {
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="stack gap-2">
      <label htmlFor={id} className="text-sm">{label}</label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className="input resize-y"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

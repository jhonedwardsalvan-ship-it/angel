import type { InputHTMLAttributes } from "react";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
  hint?: string;
};

/** Checkbox with label and optional hint. Submits "on" when checked. */
export function CheckboxField({ label, name, hint, ...props }: CheckboxFieldProps) {
  const id = `field-${name}`;
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input id={id} name={name} type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" {...props} />
      <span className="stack gap-0.5">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}

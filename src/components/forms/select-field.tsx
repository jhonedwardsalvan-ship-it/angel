import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
};

/** Labelled select, wired like FormField. */
export function SelectField({ label, name, options, placeholder, error, ...props }: SelectFieldProps) {
  const id = `field-${name}`;
  return (
    <div className="stack gap-2">
      <label htmlFor={id} className="text-sm">{label}</label>
      <select
        id={id}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  );
}

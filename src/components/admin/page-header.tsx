import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description?: string;
  /** Buttons on the right, e.g. "New product". */
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div className="stack gap-1">
        <h1 className="text-h3">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

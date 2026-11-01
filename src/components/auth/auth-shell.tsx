import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Link row under the card, e.g. "New here? Create an account". */
  footer: ReactNode;
};

/** Centered narrow card used by the sign-in and registration pages. */
export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <section className="section">
      <div className="container-narrow stack gap-8">
        <header className="stack items-center gap-3 text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-h2">{title}</h1>
          <p className="text-ink-muted">{description}</p>
        </header>
        <div className="panel">{children}</div>
        <p className="text-center text-sm text-ink-muted">{footer}</p>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  id?: string;
  action?: { label: string; href: string };
};

export function SectionHeading({ eyebrow, title, id, action }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
      <div className="stack gap-2">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="link inline-flex shrink-0 items-center gap-1.5 text-sm"
        >
          {action.label}
          <ArrowRightIcon />
        </Link>
      )}
    </div>
  );
}

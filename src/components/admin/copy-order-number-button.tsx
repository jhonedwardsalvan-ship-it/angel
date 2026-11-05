"use client";

import { useState } from "react";

export function CopyOrderNumberButton({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-grid size-9 place-items-center rounded-control border border-line text-ink-muted transition-colors hover:border-line-strong hover:bg-surface hover:text-ink print:hidden"
      onClick={copyOrderNumber}
      aria-label={copied ? "Order number copied" : `Copy order number ${orderNumber}`}
      title={copied ? "Copied" : "Copy order number"}
    >
      {copied ? (
        <svg viewBox="0 0 20 20" className="size-4 text-success" fill="none" aria-hidden="true">
          <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
          <rect x="7" y="7" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v8A1.5 1.5 0 0 0 4.5 14H7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}

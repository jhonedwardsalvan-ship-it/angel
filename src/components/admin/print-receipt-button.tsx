"use client";

export function PrintReceiptButton() {
  return (
    <button type="button" className="btn btn-primary btn-sm print:hidden" onClick={() => window.print()}>
      Print receipt
    </button>
  );
}

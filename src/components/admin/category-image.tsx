"use client";

import { useState } from "react";
import { altFromFileName, ImageUpload } from "./image-upload";

/** Single category photo: upload, replace or remove. Submits as a hidden "imageSrc" field. */
export function CategoryImage({ initial, error, altFieldId }: { initial: string; error?: string; altFieldId: string }) {
  const [src, setSrc] = useState(initial);

  function onUploaded(url: string, file: File) {
    setSrc(url);
    // Fill the description from the file name if it's still empty.
    const alt = document.getElementById(altFieldId) as HTMLInputElement | null;
    if (alt && !alt.value.trim()) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(alt, altFromFileName(file.name));
      alt.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  return (
    <div className="stack gap-3">
      <span className="text-sm">Photo</span>
      <input type="hidden" name="imageSrc" value={src} />
      {src ? (
        <div className="media relative aspect-[4/3] w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any host */}
          <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
          <button
            type="button"
            onClick={() => setSrc("")}
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-pill bg-canvas/90 text-ink shadow hover:bg-canvas"
            aria-label="Remove photo"
            title="Remove photo"
          >
            ×
          </button>
        </div>
      ) : (
        <p className="max-w-xs rounded-control border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-muted">
          No photo yet.
        </p>
      )}
      <ImageUpload target="categories" onUploaded={onUploaded} label={src ? "Replace photo" : "Upload photo"} />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

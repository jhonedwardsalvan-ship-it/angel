"use client";

import { useState } from "react";
import { parseImageLines } from "@/lib/admin/form";
import { altFromFileName, ImageUpload } from "./image-upload";

type Img = { src: string; alt: string };

/**
 * Product photo manager: upload, remove, reorder (first = cover) and describe.
 * Submits as a hidden "images" field of "url | alt" lines.
 */
export function ProductImages({ initial, error, productNameFieldId }: { initial: string; error?: string; productNameFieldId: string }) {
  const [images, setImages] = useState<Img[]>(() => parseImageLines(initial));

  function add(url: string, file: File) {
    const name = (document.getElementById(productNameFieldId) as HTMLInputElement | null)?.value.trim();
    setImages((list) => [...list, { src: url, alt: name || altFromFileName(file.name) }]);
  }
  const remove = (i: number) => setImages((list) => list.filter((_, j) => j !== i));
  const makeCover = (i: number) => setImages((list) => [list[i], ...list.filter((_, j) => j !== i)]);
  const setAlt = (i: number, alt: string) => setImages((list) => list.map((img, j) => (j === i ? { ...img, alt } : img)));

  return (
    <div className="stack gap-4">
      <input type="hidden" name="images" value={images.map((img) => `${img.src} | ${img.alt}`).join("\n")} />

      {images.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-muted">
          No photos yet. Upload at least one.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Product photos">
          {images.map((img, i) => (
            <li key={img.src} className="stack gap-2">
              <div className="media relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any host */}
                <img src={img.src} alt="" className="absolute inset-0 size-full object-cover" />
                {i === 0 && <span className="badge badge-neutral absolute top-2 left-2">Cover</span>}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-pill bg-canvas/90 text-ink shadow hover:bg-canvas"
                  aria-label={`Remove photo ${i + 1}`}
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
              <label className="sr-only" htmlFor={`img-alt-${i}`}>Description of photo {i + 1}</label>
              <input
                id={`img-alt-${i}`}
                className="input py-2 text-xs"
                value={img.alt}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Describe the photo"
                maxLength={150}
              />
              {i > 0 && (
                <button type="button" onClick={() => makeCover(i)} className="link-quiet w-fit text-xs">
                  Make cover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ImageUpload target="products" onUploaded={add} multiple />
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <p className="text-xs text-ink-muted">The cover photo is shown on product cards. Changes are saved when you click Save.</p>
      )}
    </div>
  );
}

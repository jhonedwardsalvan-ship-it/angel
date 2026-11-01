"use client";

import { useRef, useState } from "react";
import { signImageUploadAction, type UploadTarget } from "@/lib/admin/actions/uploads";

const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit per image

/** "rose-bouquet_01.jpg" → "rose bouquet 01" */
export function altFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Product photo";
}

async function uploadOne(file: File, target: UploadTarget): Promise<string> {
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  const sig = await signImageUploadAction(target, isHeic);
  if (!sig.ok) throw new Error(sig.error);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  if (sig.format) body.append("format", sig.format);
  body.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || typeof json.secure_url !== "string") {
    throw new Error(json?.error?.message ?? `Upload failed (${res.status}).`);
  }
  return json.secure_url;
}

type ImageUploadProps = {
  target: UploadTarget;
  /** Called once per finished upload, in the order the files were picked. */
  onUploaded: (url: string, file: File) => void;
  multiple?: boolean;
  label?: string;
};

/** Button that uploads photos straight to Cloudinary (signed by the server). */
export function ImageUpload({ target, onUploaded, multiple = false, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string>();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > MAX_BYTES);
    if (tooBig) return setError(`“${tooBig.name}” is larger than 10 MB. Choose a smaller photo.`);
    const notImage = list.find((f) => f.type && !f.type.startsWith("image/"));
    if (notImage) return setError(`“${notImage.name}” isn't an image.`);

    setBusy(list.length);
    for (const file of list) {
      try {
        onUploaded(await uploadOne(file, target), file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed. Try again.");
        break;
      } finally {
        setBusy((n) => n - 1);
      }
    }
    setBusy(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="stack gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={busy > 0}>
          {busy > 0 ? `Uploading${busy > 1 ? ` (${busy} left)` : ""}…` : label ?? (multiple ? "Upload photos" : "Upload photo")}
        </button>
        <span className="text-xs text-ink-muted">JPG, PNG, WebP or iPhone photos, up to 10 MB.</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

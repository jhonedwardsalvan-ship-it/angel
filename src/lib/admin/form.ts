// Helpers for parsing admin form submissions. Pure; safe on client and server.

export function text(formData: FormData, key: string, max = 2000) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

/** Whole number, or NaN when missing/invalid. */
export function wholeNumber(formData: FormData, key: string) {
  const raw = text(formData, key, 20).replace(/[,₱\s]/g, "");
  if (raw === "") return NaN;
  const n = Number(raw);
  return Number.isInteger(n) ? n : NaN;
}

/** Where product and category photos live: Cloudinary uploads, plus the original Unsplash photos. Keep in sync with next.config.ts. */
export const IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

export function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/** Parses "url | alt text" lines into images. */
export function parseImageLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [src, ...alt] = line.split("|");
      return { src: src.trim(), alt: alt.join("|").trim() };
    });
}

export function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/** Highlight rows on the settings page. */
export const MAX_HIGHLIGHTS = 4;

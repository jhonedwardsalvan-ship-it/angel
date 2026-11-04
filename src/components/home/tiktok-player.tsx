"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayIcon, TikTokIcon } from "@/components/icons";

/**
 * Cover image with a play button. TikTok's player (a heavy iframe) loads only
 * after a tap, so a row of videos doesn't slow the page down.
 */
export function TikTokPlayer({ videoId, title, coverImage }: { videoId: string; title: string; coverImage: string }) {
  const [playing, setPlaying] = useState(false);
  const label = title || "TikTok video";

  if (playing) {
    return (
      <iframe
        src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&rel=0&description=0&music_info=0`}
        title={label}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`Play: ${label}`}>
      {coverImage ? (
        <Image
          src={coverImage}
          alt=""
          fill
          sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 46vw"
          className="object-cover transition-transform duration-700 ease-standard group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-ink-muted">
          <TikTokIcon className="size-10" />
        </span>
      )}
      <span className="absolute inset-0 grid place-items-center bg-ink/10 transition-colors group-hover:bg-ink/20">
        <span className="grid size-14 place-items-center rounded-pill bg-canvas/90 text-ink shadow-md">
          <PlayIcon className="ml-0.5" />
        </span>
      </span>
    </button>
  );
}

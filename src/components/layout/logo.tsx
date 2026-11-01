import Image from "next/image";

/** The "al" wordmark with the flower, cropped from the full badge. */
export function Logo({ className = "h-9 w-auto", priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="AL flower shop"
      width={282}
      height={160}
      className={className}
      priority={priority}
    />
  );
}

/** The full round "Flower Shop" badge. Use tone="light" on dark surfaces. */
export function LogoBadge({ className = "size-20", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Image
      src={tone === "light" ? "/logo-light.png" : "/logo.png"}
      alt="AL flower shop"
      width={640}
      height={640}
      className={className}
    />
  );
}

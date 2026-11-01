import Image from "next/image";

/** The logo flower, slowly blooming (see the bloom keyframes in globals.css). */
export function BloomingFlower({ className = "size-28 md:size-36" }: { className?: string }) {
  return <Image src="/flower.png" alt="" width={160} height={160} priority className={`animate-bloom ${className}`} />;
}

/** Three dots that light up one after another, like a loading indicator. */
export function AnimatedDots() {
  return (
    <span aria-hidden="true" className="inline-flex">
      {[0, 1, 2].map((i) => (
        <span key={i} className="inline-block animate-dot" style={{ animationDelay: `${i * 0.2}s` }}>.</span>
      ))}
    </span>
  );
}

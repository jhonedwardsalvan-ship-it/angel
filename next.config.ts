import type { NextConfig } from "next";

// Sent with every response. A full script allow-list CSP is left out on purpose:
// AdSense loads from many Google domains and breaks under one.
const securityHeaders = [
  // Browsers use only HTTPS for this site for two years.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  // No other site may frame ours (clickjacking); no plugins; no <base> hijacking.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Allow opening the dev server from other devices on the LAN
  allowedDevOrigins: ["192.168.1.12"],
  images: {
    // Cloudinary uploads and the original Unsplash photos (see IMAGE_HOSTS in src/lib/admin/form.ts).
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

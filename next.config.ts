import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

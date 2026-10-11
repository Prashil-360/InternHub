/** @type {import('next').NextConfig} */
const nextConfig = {
  // Faster builds and better runtime performance
  experimental: {
    optimizeCss: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/webp", "image/avif"],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",        value: "DENY" },
        { key: "X-Content-Type-Options",  value: "nosniff" },
        { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
        // Cache static assets aggressively
        { key: "Cache-Control",           value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      // Don't cache API routes or HTML
      source: "/api/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store" },
      ],
    },
  ],
  // Compress responses
  compress: true,
};
module.exports = nextConfig;

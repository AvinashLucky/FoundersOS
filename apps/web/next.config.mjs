/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions + typed routes ready for incremental adoption.
    typedRoutes: true,
  },
  // Keep the founder surface fast: images optimized, modular transpile boundaries clear.
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;

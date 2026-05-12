import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Extract hostname from API_URL for image remotePatterns
let apiHostname = 'localhost';
try {
  apiHostname = new URL(API_URL).hostname;
} catch {}

const nextConfig: NextConfig = {
  output: 'standalone', // Optimized Docker image

  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: API_URL.startsWith('https') ? 'https' : 'http',
        hostname: apiHostname,
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 3600, // 1 hour
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Cache uploaded images (served from backend)
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Turbopack: pin workspace root to this package to avoid false detection
  turbopack: {
    root: __dirname,
  },

  // Experimental: reduce JS bundle for faster LCP
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@tanstack/react-query'],
  },
};

export default nextConfig;

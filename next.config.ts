import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses for faster transfer
  compress: true,

  // Power mode — faster builds and navigation
  poweredByHeader: false,

  // Optimize package imports — tree-shake heavy libraries
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "sonner",
      "react-hook-form",
      "zod",
      "zustand",
      "clsx",
      "tailwind-merge",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-avatar",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "class-variance-authority",
      "@tanstack/react-table",
      "jspdf",
      "xlsx",
    ],
    // Router cache — pages stay in memory for fast back/forward navigation
    staleTimes: {
      dynamic: 30, // Cache dynamic pages for 30s in router
      static: 300, // Cache static pages for 5 minutes
    },
  },

  // Server-only heavy packages — don't bundle on client
  serverExternalPackages: ["server-only"],

  async redirects() {
    return [
      {
        source: "/avatars/agent.png",
        destination: "/avatars/agent.svg",
        permanent: false,
      },
      {
        source: "/avatars/admin.png",
        destination: "/avatars/admin.svg",
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/:path*.(svg|ico|png|jpg|jpeg|webp|woff2|woff)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache JS/CSS chunks — they have content hashes
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // API security + brief cache for dashboard-type routes
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Cache relatively stable reference data APIs
        source: "/api/lead-sources",
        headers: [
          { key: "Cache-Control", value: "private, max-age=60, stale-while-revalidate=120" },
        ],
      },
      {
        source: "/api/lead-statuses",
        headers: [
          { key: "Cache-Control", value: "private, max-age=60, stale-while-revalidate=120" },
        ],
      },
    ];
  },
};

export default nextConfig;

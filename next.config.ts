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
    ],
  },

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
        // Cache API responses briefly for faster repeated navigation
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;

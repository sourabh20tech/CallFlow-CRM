import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;

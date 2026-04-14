import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ghost.io" },
      { protocol: "https", hostname: "**.onrender.com" },
    ],
  },
};

export default withPayload(nextConfig);

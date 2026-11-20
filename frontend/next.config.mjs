/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivityPosition: "bottom-right",
  },
  reactStrictMode: true,
  transpilePackages: [
    "tailwind-merge",
    "clsx",
    "class-variance-authority",
    "lucide-react",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;

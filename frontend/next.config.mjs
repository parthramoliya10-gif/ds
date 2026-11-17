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
};

export default nextConfig;

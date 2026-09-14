/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || !!process.env.NEXT_PUBLIC_VERCEL_ENV;
const isGithubActions = process.env.GITHUB_ACTIONS === 'true' && !isVercel;
const basePath = isGithubActions ? '/cropvision-saas' : '';

const nextConfig = {
  // Never enable static export on Vercel as CropVision has dynamic serverless API routes
  ...(isGithubActions ? { output: 'export' } : {}),
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: false,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;

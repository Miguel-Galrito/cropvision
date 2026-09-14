/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true' && !isVercel;
const isStaticExport = process.env.STATIC_EXPORT === 'true' || isGithubActions;
const basePath = isGithubActions ? '/cropvision-saas' : '';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  reactStrictMode: true,
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

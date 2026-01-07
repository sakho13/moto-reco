/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  output: 'standalone',
  transpilePackages: ['@repo/shared-types', '@repo/database'],
}

export default nextConfig

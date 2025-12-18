/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@packages/shared-types', '@packages/database'],
}

export default nextConfig

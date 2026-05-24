/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/database', '@repo/firebase-auth-server'],
  output: 'standalone',
}

export default nextConfig

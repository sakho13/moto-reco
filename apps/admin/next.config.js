/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@repo/database',
    '@repo/firebase-auth-server',
    '@repo/shared-types',
  ],
  output: 'standalone',
  agentRules: false,
}

export default nextConfig

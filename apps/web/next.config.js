/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/shared-types', '@repo/database'],

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.moto-reco.com',
          },
        ],
        destination: 'https://moto-reco.com/:path*',
        permanent: true,
      },
    ]
  },

  headers: () => {
    return [
      {
        source: '/app/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default nextConfig

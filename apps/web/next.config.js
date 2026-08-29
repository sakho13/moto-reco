/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/shared-types', '@repo/database'],

  // ngrok等のトンネル経由でのローカルOAuth検証用（開発時のクロスオリジンアクセス許可）
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
    ...(process.env.NEXT_PUBLIC_WEB_URL
      ? [new URL(process.env.NEXT_PUBLIC_WEB_URL).host]
      : []),
  ],

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

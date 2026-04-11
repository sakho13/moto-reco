import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cloud Run Standalone デプロイのために必須
  output: 'standalone',

  // Prisma生成コードとZodスキーマを使用するパッケージをトランスパイル
  transpilePackages: ['@repo/shared-types', '@repo/database'],

  // 管理ページ全体を noindex に設定
  headers: async () => {
    return [
      {
        source: '/(.*)',
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

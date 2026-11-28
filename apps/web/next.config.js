/**
 * Content-Security-Policy の値を組み立てる
 *
 * @remarks
 * まずは Report-Only で配信し、ブラウザの違反報告を確認してから強制（Content-Security-Policy）へ切り替える。
 * Next.js の inline スクリプトに nonce を付けていないため script-src に 'unsafe-inline' を残している。
 */
const buildContentSecurityPolicy = () => {
  const isDev = process.env.NODE_ENV !== 'production'
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https://www.googletagmanager.com',
      'https://apis.google.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.tile.openstreetmap.org',
      'https://storage.googleapis.com',
      'https://firebasestorage.googleapis.com',
      'https://images.microcms-assets.io',
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
    ],
    'font-src': ["'self'", 'data:'],
    'media-src': ["'self'", 'blob:'],
    'worker-src': ["'self'", 'blob:'],
    'connect-src': [
      "'self'",
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://storage.googleapis.com',
      'https://firebasestorage.googleapis.com',
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      ...(useEmulator
        ? ['http://localhost:9099', 'http://localhost:9199']
        : []),
      ...(isDev ? ['ws:'] : []),
    ],
    'frame-src': [
      "'self'",
      ...(firebaseAuthDomain ? [`https://${firebaseAuthDomain}`] : []),
      'https://accounts.google.com',
    ],
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/**
 * 全ルートに付与するセキュリティヘッダ
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: buildContentSecurityPolicy(),
  },
]

/**
 * 廃止・移動したページの URL を、いま案内したいページへ恒久リダイレクト（308）する
 *
 * @remarks
 * 検索結果・SNS のシェア・ブックマーク・過去のメールなど、外部から旧 URL に来たユーザーを 404 で離脱させないために置く。
 * ルートを廃止・移動したら、ここに旧 URL を追加すること。
 */
const removedPageRedirects = [
  // みんなのバイク（2026-05 廃止）
  { source: '/bikes', destination: '/' },
  { source: '/bikes/:id', destination: '/' },
  // リリースノート詳細（2026-08 廃止）。一覧の /release-note 自体は一致しない
  { source: '/release-note/:version', destination: '/release-note' },
  // 公開プロフィール・ユーザー検索（2026-11 廃止）
  { source: '/app/users/:userId', destination: '/app/home' },
  { source: '/app/search', destination: '/app/home' },
  // アプリ内で移動したページ
  { source: '/app/settings/api-keys', destination: '/docs/mcp' },
  { source: '/app/my-bike/:id/history', destination: '/app/history' },
  { source: '/app/my-bike/:id/edit', destination: '/app/my-bike/:id' },
  {
    source: '/app/my-bike/:id/fuel-logs/register',
    destination: '/app/my-bike/:id/fuel-logs',
  },
  {
    source: '/app/my-bike/:id/fuel-logs/:fuelLogId/edit',
    destination: '/app/my-bike/:id/fuel-logs',
  },
  {
    source: '/app/my-bike/:id/tourings/:touringId/edit',
    destination: '/app/my-bike/:id/tourings/:touringId',
  },
].map((redirect) => ({ ...redirect, permanent: true }))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  agentRules: false,
  transpilePackages: [
    '@repo/shared-types',
    '@repo/shared-domain',
    '@repo/database',
  ],

  // トンネル経由でのローカルOAuth検証用（開発時のクロスオリジンアクセス許可）
  // NEXT_PUBLIC_WEB_URLを検証に使うトンネルURLへ書き換えることで、どのトンネルサービスでも許可される
  allowedDevOrigins: process.env.NEXT_PUBLIC_WEB_URL
    ? [new URL(process.env.NEXT_PUBLIC_WEB_URL).host]
    : [],

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
      ...removedPageRedirects,
    ]
  },

  headers: () => {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
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

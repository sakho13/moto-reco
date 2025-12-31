'use client'

/**
 * グローバルエラーページ
 *
 * @remarks
 * このページはルートレイアウトの外側でレンダリングされるため、
 * ProvidersやAuthContextに依存してはいけません。
 */
export default function GlobalError({
  reset,
}: {
  error?: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            エラーが発生しました
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  )
}

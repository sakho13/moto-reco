import type { Metadata } from 'next'
import './globals.css'
import '@refinedev/antd/dist/reset.css'

export const metadata: Metadata = {
  title: 'Motoreco 管理画面',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* antd React 19 互換性警告を JS モジュール評価前に抑制 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          var _ce = console.error.bind(console);
          console.error = function() {
            var msg = typeof arguments[0] === 'string' ? arguments[0] : '';
            if (msg.indexOf('antd v5 support React is 16') !== -1) return;
            _ce.apply(console, arguments);
          };
          var _cw = console.warn.bind(console);
          console.warn = function() {
            var msg = typeof arguments[0] === 'string' ? arguments[0] : '';
            if (msg.indexOf('[antd] There exists deprecated usage') !== -1) return;
            _cw.apply(console, arguments);
          };
        `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

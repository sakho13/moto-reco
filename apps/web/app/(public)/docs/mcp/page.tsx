import type { Metadata } from 'next'
import { Tabs } from '@repo/ui/tabs'
import styles from './page.module.css'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `MCP セットアップ`,
  description: `${APP_NAME} の MCP サーバーを Claude Code や Claude Desktop から利用するための設定方法です。`,
  openGraph: {
    url: `${SITE_URL}/docs/mcp`,
    title: `MCP セットアップ | ${APP_NAME}`,
    description: `${APP_NAME} の MCP サーバーを Claude Code や Claude Desktop から利用するための設定方法です。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `MCP セットアップ | ${APP_NAME}`,
    description: `${APP_NAME} の MCP セットアップガイドです。`,
    images: ['/top_image_1.png'],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/docs/mcp',
  },
  robots: { index: false },
}

const claudeCodeContent = (
  <div className={styles.tabContent}>
    <p className={styles.sectionBody}>
      <code className={styles.inlineCode}>~/.claude/settings.json</code>{' '}
      に以下を追加してください：
    </p>
    <pre className={styles.codeBlock}>{`{
  "mcpServers": {
    "motoreco": {
      "type": "http",
      "url": "https://moto-reco.com/api/mcp",
      "headers": {
        "Authorization": "Bearer <発行したAPIキー>"
      }
    }
  }
}`}</pre>
  </div>
)

const claudeDesktopContent = (
  <div className={styles.tabContent}>
    <p className={styles.sectionBody}>
      Claude Desktop は HTTP 形式の MCP サーバーを直接サポートしていないため、
      <code className={styles.inlineCode}>mcp-remote</code>{' '}
      を介して接続します。Node.js がインストールされている必要があります。
    </p>
    <p className={styles.sectionBody}>
      <code className={styles.inlineCode}>claude_desktop_config.json</code>{' '}
      に以下を追加してください：
    </p>
    <pre className={styles.codeBlock}>{`{
  "mcpServers": {
    "motoreco": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://moto-reco.com/api/mcp",
        "--header",
        "Authorization: Bearer <発行したAPIキー>"
      ]
    }
  }
}`}</pre>
  </div>
)

export default function McpSetupPage() {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>MCP セットアップ</h1>
        <p className={styles.description}>
          {APP_NAME} の MCP サーバーを Claude Code や Claude Desktop
          から利用するための設定方法です。
        </p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. APIキーを発行する</h2>
          <p className={styles.sectionBody}>
            アプリのプロフィール画面から「オプション」→「MCP
            APIキー管理」を開き、
            APIキーを発行してください。キーは発行後に一度だけ表示されます。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. アプリに設定する</h2>
          <Tabs
            tabs={[
              {
                id: 'claude-code',
                label: 'Claude Code',
                content: claudeCodeContent,
              },
              {
                id: 'claude-desktop',
                label: 'Claude Desktop',
                content: claudeDesktopContent,
              },
            ]}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>利用可能なツール</h2>
          <p className={styles.sectionBody}>以下のツールが利用できます：</p>
          <ul>
            <li>
              <strong>list_bikes</strong> — 登録されているマイバイクの一覧を取得
            </li>
            <li>
              <strong>list_touring_plans</strong> —
              指定バイクのツーリングプラン一覧を取得
            </li>
            <li>
              <strong>get_touring_plan</strong> —
              ツーリングプランの詳細（スポット含む）を取得
            </li>
            <li>
              <strong>get_maintenance_status</strong> —
              バイクのメンテナンス状況と次回推奨時期を取得
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}

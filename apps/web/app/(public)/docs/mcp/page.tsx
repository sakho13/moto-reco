import type { Metadata } from 'next'
import { Tabs } from '@repo/ui/tabs'
import styles from './page.module.css'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `MCP セットアップ`,
  description: `${APP_NAME} の MCP サーバーを Claude Code や Claude Desktop、ChatGPT から利用するための設定方法です。`,
  openGraph: {
    url: `${SITE_URL}/docs/mcp`,
    title: `MCP セットアップ | ${APP_NAME}`,
    description: `${APP_NAME} の MCP サーバーを Claude Code や Claude Desktop、ChatGPT から利用するための設定方法です。`,
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
      "url": "${SITE_URL}/api/mcp",
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
        "${SITE_URL}/api/mcp",
        "--header",
        "Authorization: Bearer <発行したAPIキー>"
      ]
    }
  }
}`}</pre>
  </div>
)

const claudeAppContent = (
  <div className={styles.tabContent}>
    <p className={styles.sectionBody}>
      Claude.ai（Web/Desktop/Mobile）の「コネクタを追加」機能はOAuth認証に対応しており、
      APIキーの手動発行・設定は不要です。
    </p>
    <ol className={styles.orderedList}>
      <li>Claude.aiの「設定」→「コネクタ」（Settings → Connectors）を開く</li>
      <li>
        「カスタムコネクタを追加」（Add custom connector）を選択し、名前（例:
        motoreco）とサーバーURL{' '}
        <code className={styles.inlineCode}>{`${SITE_URL}/api/mcp`}</code>{' '}
        を入力して保存する
      </li>
      <li>自動的にmoto-recoの認可画面が開くので、ログインして「許可」を押す</li>
      <li>接続が完了し、チャット画面でツールが利用できるようになります</li>
    </ol>
    <p className={styles.sectionBody}>
      ※ APIキー方式（Claude
      Code向け）とは別の認証方式です。どちらも併用できます。
    </p>
  </div>
)

const chatGptContent = (
  <div className={styles.tabContent}>
    <p className={styles.sectionBody}>
      ChatGPT の「設定」→「コネクタ」（Settings → Connectors）から追加します。
      利用にはPlus/Pro/Business/Enterpriseなど対応プランと、
      開発者モード（Developer mode）の有効化が必要な場合があります。
    </p>
    <ol className={styles.orderedList}>
      <li>
        「コネクタを作成」（Create connector）をクリックし、名前（例:
        motoreco）を入力
      </li>
      <li>
        MCPサーバーURLに{' '}
        <code className={styles.inlineCode}>{`${SITE_URL}/api/mcp`}</code>{' '}
        を入力
      </li>
      <li>
        ChatGPTのコネクタも同一のOAuth仕様に対応しています。認証方法で「OAuth」が選択できる場合は、そちらを選ぶことでAPIキーなしで接続できます（自動的にmoto-recoのログイン・認可画面に遷移します）。「OAuth」の選択肢が表示されない場合は、以下の「カスタムヘッダー」方式を使用してください。
      </li>
      <li>
        認証方法で「カスタムヘッダー」（Custom header）を選択し、以下を入力
        <pre className={styles.codeBlock}>{`ヘッダー名: Authorization
値: Bearer <発行したAPIキー>`}</pre>
      </li>
      <li>保存後、チャット画面でコネクタを有効にすると利用できます</li>
    </ol>
  </div>
)

export default function McpSetupPage() {
  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>MCP セットアップ</h1>
        <p className={styles.description}>
          {APP_NAME} の MCP サーバーを Claude Code や Claude Desktop、ChatGPT
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
              {
                id: 'claude-app',
                label: 'Claude.ai / Claude Desktop（OAuth）',
                content: claudeAppContent,
              },
              {
                id: 'chatgpt',
                label: 'ChatGPT',
                content: chatGptContent,
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
              <strong>list_touring_history</strong> —
              指定バイクのツーリング履歴一覧を取得
            </li>
            <li>
              <strong>get_touring_history</strong> — ツーリング履歴の詳細を取得
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

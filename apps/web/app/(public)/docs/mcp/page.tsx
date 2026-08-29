import type { Metadata } from 'next'
import { Tabs } from '@repo/ui/tabs'
import styles from './page.module.css'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `MCP セットアップ`,
  description: `${APP_NAME} の MCP サーバーを ClaudeやChatGPT から利用するための設定方法です。`,
  openGraph: {
    url: `${SITE_URL}/docs/mcp`,
    title: `MCP セットアップ | ${APP_NAME}`,
    description: `${APP_NAME} の MCP サーバーを ClaudeやChatGPT から利用するための設定方法です。`,
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
      ターミナルで以下のコマンドを実行してMCPサーバーを追加してください：
    </p>
    <pre
      className={styles.codeBlock}
    >{`claude mcp add --transport http motoreco ${SITE_URL}/api/mcp`}</pre>
    <p className={styles.sectionBody}>
      追加後、Claude Code内で <code className={styles.inlineCode}>/mcp</code>{' '}
      コマンドを実行するとOAuth認可フローが開始されます。ブラウザが開くので
      moto-recoにログインし「許可する」を押してください。APIキーの発行・設定は不要です。
    </p>
  </div>
)

const claudeAppContent = (
  <div className={styles.tabContent}>
    <p className={styles.sectionBody}>
      Claude.ai（Web/Desktop/Mobile）の「コネクタを追加」機能から、
      APIキーの発行・設定なしで接続できます。
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
      <li>認証方法で「OAuth」を選択して保存する</li>
      <li>
        自動的にmoto-recoのログイン・認可画面が開くので、ログインして「許可する」を押す
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
          {APP_NAME} の MCP サーバーを Claude Code や Claude.ai、ChatGPT
          から利用するための設定方法です。いずれもOAuth認証に対応しており、
          APIキーの発行・設定は不要です。
        </p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>接続方法</h2>
          <Tabs
            tabs={[
              {
                id: 'claude-code',
                label: 'Claude Code',
                content: claudeCodeContent,
              },
              {
                id: 'claude-app',
                label: 'Claude.ai / Desktop / Mobile',
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

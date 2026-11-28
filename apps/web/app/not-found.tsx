import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeProvider } from '@repo/ui/context/ThemeContext'
import styles from './not-found.module.css'

/**
 * 404 ページの metadata
 *
 * @remarks
 * ルートレイアウトの template がかかり「ページが見つかりません | MotoReco」になる。
 * タイトルを付けることで GA で 404 ページを他のページと見分けられるようにする。
 * noindex の meta は Next.js が 404 応答に自動で付ける。
 */
export const metadata: Metadata = {
  title: 'ページが見つかりません',
}

type NotFoundLink = {
  href: string
  label: string
}

/** 404 から次に進んでもらう主要ページ */
const SUGGESTED_LINKS: NotFoundLink[] = [
  { href: '/blog', label: 'ブログ' },
  { href: '/moped-test', label: '原付免許試験の練習問題' },
  { href: '/faq', label: 'よくある質問' },
]

/**
 * 存在しない URL にアクセスされたときのページ
 *
 * @remarks
 * ルートレイアウト直下で描画されるためヘッダー・フッターがない。
 * 離脱を減らすため、トップ・アプリ・主要コンテンツへの導線を置く。
 * テーマの CSS 変数は ThemeProvider が設定するため、ここでも包む。
 */
export default function NotFound() {
  return (
    <ThemeProvider initialThemeName="default">
      <main className={styles.container}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>ページが見つかりません</h1>
        <p className={styles.description}>
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            トップへ戻る
          </Link>
          <Link href="/app" className={styles.secondaryButton}>
            アプリを始める
          </Link>
        </div>
        <nav className={styles.suggestions} aria-label="おすすめのページ">
          <p className={styles.suggestionsHeading}>こちらのページもどうぞ</p>
          <ul className={styles.suggestionList}>
            {SUGGESTED_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.suggestionLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </ThemeProvider>
  )
}

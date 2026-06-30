import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import { getReleaseNotes } from '@/lib/microcms/releaseNote'
import { APP_NAME, SITE_URL } from '@/lib/statics'
import { stripHtmlToText } from '@/lib/utils/html'

export const revalidate = 300

export const metadata: Metadata = {
  title: `リリースノート`,
  description: `${APP_NAME} の最新のアップデート情報・新機能・改善点をまとめています。`,
  openGraph: {
    url: `${SITE_URL}/release-note`,
    title: `リリースノート | ${APP_NAME}`,
    description: `${APP_NAME} の最新のアップデート情報・新機能・改善点をまとめています。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `リリースノート | ${APP_NAME}`,
    description: `${APP_NAME} の最新のアップデート情報・新機能・改善点をまとめています。`,
    images: ['/top_image_1.png'],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/release-note',
  },
}

export default async function ReleaseNotePage() {
  const releaseNotes = await getReleaseNotes()

  return (
    <div className="public-page-container">
      <header className={styles.header}>
        <h1 className={styles.title}>リリースノート</h1>
        <p className={styles.description}>
          {APP_NAME} の最新のアップデート情報・新機能・改善点をまとめています。
        </p>
      </header>

      {releaseNotes.length === 0 ? (
        <div className={styles.empty}>
          <p>現在、リリースノートはありません。</p>
        </div>
      ) : (
        <div className={styles.list}>
          {releaseNotes.map((note) => (
            <Link
              key={note.id}
              href={`/release-note/${note.version}`}
              className={styles.item}
            >
              <div className={styles.itemHeader}>
                <span className={styles.version}>v{note.version}</span>
                <time
                  className={styles.date}
                  dateTime={note.releaseDate ?? note.createdAt}
                >
                  {new Date(
                    note.releaseDate ?? note.createdAt
                  ).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <h2 className={styles.itemTitle}>{note.title}</h2>
              <p className={styles.excerpt}>{stripHtmlToText(note.content)}</p>
              <span className={styles.readMore}>詳細を見る →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

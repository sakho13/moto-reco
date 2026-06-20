import type { Metadata } from 'next'
import { formatDateTime } from '@repo/shared-utils'
import styles from './page.module.css'
import { microCMSClient } from '@/lib/microcms/config'
import type { ReleaseNote } from '@/lib/microcms/types'
import { APP_NAME, SITE_URL } from '@/lib/statics'

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

async function getReleaseNotes(): Promise<ReleaseNote[]> {
  try {
    if (!microCMSClient) return []
    const data = await microCMSClient.getList<ReleaseNote>({
      endpoint: 'motoreco-releases',
      queries: {
        orders: '-publishedAt',
        limit: 100,
        filters:
          process.env.NODE_ENV !== 'development'
            ? 'status[contains]published'
            : undefined,
      },
    })
    return data.contents
  } catch {
    return []
  }
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
            <article key={note.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.version}>v{note.version}</span>
                <time
                  className={styles.date}
                  dateTime={note.releaseDate ?? note.createdAt}
                >
                  {formatDateTime(note.releaseDate ?? note.createdAt)}
                </time>
              </div>
              <h2 className={styles.itemTitle}>{note.title}</h2>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

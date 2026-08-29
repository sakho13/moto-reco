import type { Metadata } from 'next'
import { prisma } from '@repo/database'
import styles from './page.module.css'
import ReleaseNoteList from './ReleaseNoteList'
import { PrismaAnnouncementRepository } from '@/lib/api/server/repositories/PrismaAnnouncementRepository'
import {
  AnnouncementService,
  type PublishedReleaseNote,
} from '@/lib/api/server/services/AnnouncementService'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

const RELEASE_NOTES_FETCH_TIMEOUT_MS = 5000

/**
 * 公開リリースノートを取得する。
 * ビルド時などDBに接続できない・応答が遅い環境でもページ生成を止めないよう、
 * 取得失敗・タイムアウト時は空配列にフォールバックする（sitemap.tsと同様の方針）
 */
async function getReleaseNotesSafely(
  service: AnnouncementService
): Promise<PublishedReleaseNote[]> {
  try {
    return await Promise.race([
      service.getPublishedReleaseNotes(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('リリースノート取得がタイムアウトしました')),
          RELEASE_NOTES_FETCH_TIMEOUT_MS
        )
      ),
    ])
  } catch (error) {
    console.error('[release-note] 取得失敗', {
      message: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

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
  const service = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  const releaseNotes = await getReleaseNotesSafely(service)

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
        <ReleaseNoteList releaseNotes={releaseNotes} />
      )}
    </div>
  )
}

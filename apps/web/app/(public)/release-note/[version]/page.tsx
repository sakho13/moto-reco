import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from './page.module.css'
import { microCMSClient } from '@/lib/microcms/config'
import type { ReleaseNote } from '@/lib/microcms/types'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

type Props = {
  params: Promise<{ version: string }>
}

type ReleaseNoteSummary = Pick<ReleaseNote, 'version' | 'title'>

async function getReleaseNoteByVersion(
  version: string
): Promise<ReleaseNote | null> {
  try {
    if (!microCMSClient) return null
    const data = await microCMSClient.getList<ReleaseNote>({
      endpoint: 'motoreco-releases',
      queries: {
        filters: `version[equals]${version}${
          process.env.NODE_ENV !== 'development'
            ? '[and]status[contains]published'
            : ''
        }`,
        limit: 1,
      },
    })
    return data.contents[0] ?? null
  } catch {
    return null
  }
}

async function getAdjacentReleaseNotes(version: string): Promise<{
  prev: ReleaseNoteSummary | null
  next: ReleaseNoteSummary | null
}> {
  try {
    if (!microCMSClient) return { prev: null, next: null }
    const data = await microCMSClient.getList<ReleaseNoteSummary>({
      endpoint: 'motoreco-releases',
      queries: {
        orders: '-publishedAt',
        limit: 100,
        fields: 'version,title',
        filters:
          process.env.NODE_ENV !== 'development'
            ? 'status[contains]published'
            : undefined,
      },
    })
    const notes = data.contents
    const index = notes.findIndex((note) => note.version === version)
    if (index === -1) return { prev: null, next: null }

    return {
      prev: notes[index + 1] ?? null,
      next: index > 0 ? (notes[index - 1] ?? null) : null,
    }
  } catch {
    return { prev: null, next: null }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params
  const releaseNote = await getReleaseNoteByVersion(version)

  if (!releaseNote) {
    return { title: 'リリースノートが見つかりません' }
  }

  const title = `v${releaseNote.version} ${releaseNote.title}`
  const description = `${APP_NAME} v${releaseNote.version} のリリースノートです。`

  return {
    title,
    description,
    openGraph: {
      url: `${SITE_URL}/release-note/${version}`,
      title: `${title} | ${APP_NAME}`,
      description,
      images: ['/top_image_1.png'],
    },
    twitter: {
      title: `${title} | ${APP_NAME}`,
      description,
      images: ['/top_image_1.png'],
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `/release-note/${version}`,
    },
  }
}

export default async function ReleaseNoteDetailPage({ params }: Props) {
  const { version } = await params
  const releaseNote = await getReleaseNoteByVersion(version)

  if (!releaseNote) {
    notFound()
  }

  const { prev, next } = await getAdjacentReleaseNotes(version)

  return (
    <div className="public-page-container">
      <article className={styles.article}>
        <header className={styles.header}>
          <div className={styles.itemHeader}>
            <span className={styles.version}>v{releaseNote.version}</span>
            <time
              className={styles.date}
              dateTime={releaseNote.releaseDate ?? releaseNote.createdAt}
            >
              {new Date(
                releaseNote.releaseDate ?? releaseNote.createdAt
              ).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <h1 className={styles.articleTitle}>{releaseNote.title}</h1>
        </header>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: releaseNote.content }}
        />

        {(prev || next) && (
          <nav className={styles.pager}>
            {prev ? (
              <Link
                href={`/release-note/${prev.version}`}
                className={styles.pagerLink}
              >
                <span className={styles.pagerLabel}>← 前のバージョン</span>
                <span className={styles.pagerVersion}>v{prev.version}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/release-note/${next.version}`}
                className={`${styles.pagerLink} ${styles.pagerLinkNext}`}
              >
                <span className={styles.pagerLabel}>次のバージョン →</span>
                <span className={styles.pagerVersion}>v{next.version}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </article>
    </div>
  )
}

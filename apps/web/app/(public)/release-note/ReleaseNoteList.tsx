'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { stripHtmlToText } from '@/lib/utils/html'

type ReleaseNote = {
  announcementId: string
  version: string
  title: string
  body: string
  publishedAt: string
}

type Props = {
  releaseNotes: ReleaseNote[]
}

const INITIAL_COUNT = 10

export default function ReleaseNoteList({ releaseNotes }: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const displayed = releaseNotes.slice(0, visibleCount)
  const hasMore = releaseNotes.length > visibleCount

  return (
    <div className={styles.list}>
      {displayed.map((note) => {
        const expanded = expandedId === note.announcementId
        const formattedDate = new Date(note.publishedAt).toLocaleDateString(
          'ja-JP',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )

        return (
          <div key={note.announcementId} className={styles.item}>
            <button
              type="button"
              className={styles.itemButton}
              aria-expanded={expanded}
              onClick={() =>
                setExpandedId(expanded ? null : note.announcementId)
              }
            >
              <div className={styles.itemHeader}>
                <span className={styles.version}>v{note.version}</span>
                <time className={styles.date} dateTime={note.publishedAt}>
                  {formattedDate}
                </time>
              </div>
              <h2 className={styles.itemTitle}>{note.title}</h2>
              <span className={styles.readMore}>
                {expanded ? '閉じる ↑' : '詳細を見る →'}
              </span>
            </button>
            {expanded ? (
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: note.body }}
              />
            ) : (
              <p className={styles.excerpt}>{stripHtmlToText(note.body)}</p>
            )}
          </div>
        )
      })}
      {hasMore && (
        <button
          type="button"
          className={styles.loadMoreButton}
          onClick={() => setVisibleCount((prev) => prev + INITIAL_COUNT)}
        >
          もっと見る
        </button>
      )}
    </div>
  )
}

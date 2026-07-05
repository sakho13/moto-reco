import { safeGetList, safeGetListItem, withPublishedFilter } from './queries'
import type { ReleaseNote } from './types'

const ENDPOINT = 'motoreco-releases'

type ReleaseNoteSummary = Pick<ReleaseNote, 'version' | 'title'>

export async function getReleaseNotes(): Promise<ReleaseNote[]> {
  return safeGetList<ReleaseNote>(ENDPOINT, {
    orders: '-publishedAt',
    limit: 100,
    filters: withPublishedFilter(),
  })
}

export async function getReleaseNoteByVersion(
  version: string
): Promise<ReleaseNote | null> {
  return safeGetListItem<ReleaseNote>(ENDPOINT, {
    filters: withPublishedFilter(`version[equals]${version}`),
  })
}

export async function getAdjacentReleaseNotes(version: string): Promise<{
  prev: ReleaseNoteSummary | null
  next: ReleaseNoteSummary | null
}> {
  const notes = await safeGetList<ReleaseNoteSummary>(ENDPOINT, {
    orders: '-publishedAt',
    limit: 100,
    fields: 'version,title',
    filters: withPublishedFilter(),
  })

  const index = notes.findIndex((note) => note.version === version)
  if (index === -1) return { prev: null, next: null }

  return {
    prev: notes[index + 1] ?? null,
    next: index > 0 ? (notes[index - 1] ?? null) : null,
  }
}

export async function getReleaseNoteSitemapEntries(): Promise<
  Pick<ReleaseNote, 'version' | 'updatedAt'>[]
> {
  return safeGetList<Pick<ReleaseNote, 'version' | 'updatedAt'>>(
    ENDPOINT,
    {
      orders: '-publishedAt',
      limit: 100,
      fields: 'version,updatedAt',
      filters: withPublishedFilter(),
    },
    'sitemap:release-note'
  )
}

'use client'

import { useRouter } from 'next/navigation'
import styles from './BlogToc.module.css'
import type { TocHeading } from '@/lib/blog/toc'

type Props = {
  headings: TocHeading[]
}

export function BlogToc({ headings }: Props) {
  const router = useRouter()

  if (headings.length === 0) return null

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    router.push(`#${id}`, { scroll: false })
  }

  return (
    <nav className={styles.toc} data-nosnippet>
      <p className={styles.title}>目次</p>
      <ol className={styles.list}>
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? styles.itemH3 : styles.itemH2}>
            <a href={`#${id}`} onClick={(e) => handleClick(e, id)}>
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

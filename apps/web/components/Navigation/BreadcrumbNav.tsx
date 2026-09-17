'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BreadcrumbNav.module.css'

type BreadcrumbItem = {
  label: string
  href?: string
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)

  if (pathname === '/app/home') {
    return [{ label: 'ホーム' }]
  }

  const items: BreadcrumbItem[] = []

  if (segments[1] === 'my-bike') {
    const bikeId = segments[2]
    const detailHref = bikeId ? `/app/my-bike/${bikeId}` : undefined
    // 愛車の詳細は一覧を廃して直行するため、詳細ページ自体は
    // 「愛車」の単一階層で表す（「バイク詳細」という別階層は作らない）
    const isDetailPage = segments.length === 3

    if (segments[3] === 'edit') {
      items.push({ label: '愛車', href: detailHref })
      items.push({ label: '編集' })
      return items
    }

    if (segments[3] === 'fuel-logs') {
      items.push({ label: '愛車', href: detailHref })
      items.push({
        label: '給油履歴',
        href: `/app/my-bike/${bikeId}/fuel-logs`,
      })
      if (segments[4] === 'register') {
        items.push({ label: '登録' })
      } else if (segments[5] === 'edit') {
        items.push({ label: '編集' })
      }
      return items
    }

    if (segments[3] === 'goods') {
      items.push({ label: '愛車', href: detailHref })
      items.push({ label: '取り付けアクセサリ' })
      return items
    }

    if (segments[3] === 'maintenance-logs') {
      items.push({ label: '愛車', href: detailHref })
      items.push({ label: 'メンテナンス履歴' })
      return items
    }

    if (segments[3] === 'touring-plans') {
      items.push({ label: '愛車', href: detailHref })
      items.push({
        label: 'ツーリングプラン一覧',
        href: `/app/my-bike/${bikeId}/touring-plans`,
      })
      if (segments[4] === 'register') {
        items.push({ label: 'ツーリングプラン登録' })
      } else if (segments[4]) {
        items.push({ label: 'ツーリングプラン詳細' })
      }
      return items
    }

    if (segments[3] === 'tourings') {
      items.push({ label: '愛車', href: detailHref })
      items.push({
        label: 'ツーリング一覧',
        href: `/app/my-bike/${bikeId}/tourings`,
      })
      if (segments[4] === 'register') {
        items.push({ label: 'ツーリング登録' })
      } else if (segments[4]) {
        items.push({ label: 'ツーリング詳細' })
      }
      return items
    }

    items.push({ label: '愛車', href: isDetailPage ? undefined : detailHref })
    return items
  }

  if (segments[1] === 'history') {
    items.push({ label: 'ヒストリー' })
    return items
  }

  if (segments[1] === 'goods') {
    items.push({ label: 'グッズ', href: '/app/goods' })

    if (segments[2] === 'catalog') {
      items.push({ label: 'グッズ登録' })
      return items
    }

    if (segments.length === 2) {
      items[items.length - 1] = { label: 'グッズ' }
    }

    return items
  }

  if (segments[1] === 'photos') {
    items.push({ label: 'フォト' })
    return items
  }

  if (segments[1] === 'bike' && segments[2] === 'register') {
    items.push({ label: 'バイク登録' })
    return items
  }

  if (segments[1] === 'profile') {
    items.push({ label: 'プロフィール', href: '/app/profile' })

    if (segments[2] === 'account') {
      items.push({ label: '認証情報' })
    } else if (segments[2] === 'plan') {
      items.push({ label: 'プラン' })
    }

    return items
  }

  if (segments[1] === 'search') {
    items.push({ label: 'ユーザーを探す' })
    return items
  }

  if (segments[1] === 'notifications') {
    items.push({ label: '通知' })
    return items
  }

  if (segments[1] === 'users') {
    items.push({ label: 'ユーザープロフィール' })
    return items
  }

  return [{ label: 'ページ' }]
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  if (!pathname.startsWith('/app')) {
    return null
  }

  const breadcrumbs = buildBreadcrumbs(pathname)

  return (
    <nav className={styles.wrapper} aria-label="パンくず">
      <ol className={styles.list}>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`${styles.label} ${styles.link}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={styles.label}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <span className={styles.separator}>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

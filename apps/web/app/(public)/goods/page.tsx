import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@repo/database'
import type { GoodsCategory, GoodsModelId } from '@repo/shared-types'
import styles from './page.module.css'
import {
  GOODS_CATEGORY_LABELS,
  GOODS_CATEGORY_ORDER,
} from '@/components/goods/goodsCategoryLabels'
import { PrismaCompanyRepository } from '@/lib/api/server/repositories/PrismaCompanyRepository'
import { PrismaGoodsModelRepository } from '@/lib/api/server/repositories/PrismaGoodsModelRepository'
import { GoodsModelSearchParams } from '@/lib/api/server/valueObjects/GoodsModelSearchParams'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

const PAGE_DESCRIPTION = `${APP_NAME}に登録されているバイク用品メーカー・アクセサリの一覧です。メーカーや種類、型番から探せます。`

export const metadata: Metadata = {
  title: 'アクセサリ',
  description: PAGE_DESCRIPTION,
  openGraph: {
    url: `${SITE_URL}/goods`,
    title: `アクセサリ | ${APP_NAME}`,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    title: `アクセサリ | ${APP_NAME}`,
    description: PAGE_DESCRIPTION,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/goods',
  },
}

function toGoodsCategory(value: string | undefined): GoodsCategory | undefined {
  return GOODS_CATEGORY_ORDER.find((c) => c === value)
}

export default async function PublicGoodsPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string
    manufacturerId?: string
    category?: string
  }>
}) {
  const {
    keyword,
    manufacturerId: rawManufacturerId,
    category: rawCategory,
  } = await searchParams
  const trimmedKeyword = keyword?.trim() || undefined
  const category = toGoodsCategory(rawCategory)

  const companyRepo = new PrismaCompanyRepository(prisma)
  const modelRepo = new PrismaGoodsModelRepository(prisma)

  const manufacturers = (
    await companyRepo.findAll({ category: 'GOODS_MANUFACTURER' })
  ).filter((m) => m.isActive)

  const manufacturerId = manufacturers.some((m) => m.id === rawManufacturerId)
    ? rawManufacturerId
    : undefined

  const models = await modelRepo.search(
    new GoodsModelSearchParams({
      keyword: trimmedKeyword,
      manufacturerId,
      category,
      pageSize: 100,
    })
  )

  const isFiltered = Boolean(trimmedKeyword || manufacturerId || category)

  return (
    <div className="public-page-container">
      <header className={styles.header}>
        <h1 className={styles.title}>アクセサリ</h1>
        <p className={styles.description}>{PAGE_DESCRIPTION}</p>
      </header>

      <form action="/goods" method="get" className={styles.searchForm}>
        <select
          name="manufacturerId"
          defaultValue={manufacturerId ?? ''}
          className={styles.searchSelect}
        >
          <option value="">すべてのメーカー</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ''}
          className={styles.searchSelect}
        >
          <option value="">すべての種類</option>
          {GOODS_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {GOODS_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          type="search"
          name="keyword"
          defaultValue={trimmedKeyword}
          placeholder="型番・商品名で検索"
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          検索
        </button>
      </form>

      {models.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {isFiltered
              ? '該当するアクセサリが見つかりませんでした。'
              : '現在、掲載しているアクセサリはありません。'}
          </p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {models.map((model) => (
            <li key={model.id as GoodsModelId}>
              <Link href={`/goods/${model.id}`} className={styles.card}>
                <div className={styles.cardImage}>
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      fill
                      sizes="(max-width: 900px) 100vw, 320px"
                      style={{ objectFit: 'contain' }}
                      unoptimized
                    />
                  ) : (
                    <ShoppingBag
                      className={styles.cardImagePlaceholder}
                      size={40}
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardManufacturer}>
                    {model.manufacturerName}
                  </p>
                  <p className={styles.cardCategory}>
                    {GOODS_CATEGORY_LABELS[model.category]}
                  </p>
                  <p className={styles.cardTitle}>{model.name}</p>
                  <p className={styles.cardModelNumber}>{model.modelNumber}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

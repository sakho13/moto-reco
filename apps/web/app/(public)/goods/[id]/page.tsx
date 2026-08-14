import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { createGoodsModelId } from '@repo/shared-types'
import styles from './page.module.css'
import { GOODS_CATEGORY_LABELS } from '@/components/goods/goodsCategoryLabels'
import { PrismaGoodsModelRepository } from '@/lib/api/server/repositories/PrismaGoodsModelRepository'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const modelRepo = new PrismaGoodsModelRepository(prisma)
  const model = await modelRepo.findById(createGoodsModelId(id))

  if (!model) {
    return { title: 'アクセサリが見つかりません' }
  }

  const title = `${model.manufacturerName} ${model.name}`
  const description =
    model.description ??
    `${APP_NAME}に登録されている${model.manufacturerName}の${model.name}（${model.modelNumber}）の情報です。`

  return {
    title,
    description,
    openGraph: {
      url: `${SITE_URL}/goods/${id}`,
      title: `${title} | ${APP_NAME}`,
      description,
      ...(model.imageUrl ? { images: [model.imageUrl] } : {}),
    },
    twitter: {
      title: `${title} | ${APP_NAME}`,
      description,
      ...(model.imageUrl ? { images: [model.imageUrl] } : {}),
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `/goods/${id}`,
    },
  }
}

export default async function GoodsDetailPage({ params }: Props) {
  const { id } = await params
  const modelRepo = new PrismaGoodsModelRepository(prisma)
  const model = await modelRepo.findById(createGoodsModelId(id))

  if (!model) {
    notFound()
  }

  return (
    <div className="public-page-container">
      <div className={styles.backLinkWrap}>
        <Link href="/goods" className={styles.backLink}>
          ← アクセサリ一覧へ戻る
        </Link>
      </div>

      <article className={styles.article}>
        {model.imageUrl && (
          <div className={styles.image}>
            <Image
              src={model.imageUrl}
              alt={model.name}
              fill
              sizes="(max-width: 900px) 100vw, 480px"
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
        )}

        <div className={styles.body}>
          <p className={styles.manufacturer}>{model.manufacturerName}</p>
          <p className={styles.category}>
            {GOODS_CATEGORY_LABELS[model.category]}
          </p>
          <h1 className={styles.title}>{model.name}</h1>
          <p className={styles.modelNumber}>{model.modelNumber}</p>

          {model.description && (
            <p className={styles.description}>{model.description}</p>
          )}

          {(model.officialUrl || model.amazonUrl || model.rakutenUrl) && (
            <div className={styles.linksRow}>
              {model.officialUrl && (
                <a
                  href={model.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkButton}
                >
                  公式サイト
                </a>
              )}
              {model.amazonUrl && (
                <a
                  href={model.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkButton}
                >
                  Amazon
                </a>
              )}
              {model.rakutenUrl && (
                <a
                  href={model.rakutenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkButton}
                >
                  楽天市場
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

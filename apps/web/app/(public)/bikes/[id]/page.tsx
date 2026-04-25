import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { createMyUserBikeId } from '@repo/shared-types'
import styles from './page.module.css'
import TouringList from './TouringList'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'
import { PrismaTouringRepository } from '@/lib/api/server/repositories/PrismaTouringRepository'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `公開バイク詳細`,
    description: `${APP_NAME}で公開されているバイクの詳細ページです。`,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `/bikes/${id}`,
    },
  }
}

export const revalidate = 300

const getPublicBike = async (id: string) => {
  const repo = new PrismaMyUserBikeRepository(prisma)
  return repo.findPublicBikeById(createMyUserBikeId(id))
}

const getPublicTourings = async (id: string) => {
  const repo = new PrismaTouringRepository(prisma)
  return repo.findPublicTouringsByBikeId(createMyUserBikeId(id))
}

export default async function PublicBikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [bike, tourings] = await Promise.all([
    getPublicBike(id),
    getPublicTourings(id),
  ])

  if (!bike) {
    notFound()
  }

  const title =
    bike.nickname ||
    `${bike.manufacturerName ?? ''} ${bike.modelName ?? '不明なバイク'}`.trim()

  const displacement = `${bike.displacement}cc`
  const modelYear = bike.modelYear ? `${bike.modelYear}年式` : null
  const updatedAt = bike.updatedAt.toLocaleDateString('ja-JP')
  const subtitle = [displacement, modelYear, `最終更新日: ${updatedAt}`]
    .filter(Boolean)
    .join(' / ')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <section className={styles.card}>
        <div className={styles.pair}>
          <span className={styles.label}>総走行距離</span>
          <span className={styles.value}>
            {bike.totalMileage.toLocaleString()} km
          </span>
        </div>
      </section>

      <div className="h-4" />

      <section className={styles.card}>
        <h2 className={styles.label}>ツーリング履歴</h2>
        <TouringList tourings={tourings} />
      </section>

      <div className="h-4" />

      <section className={styles.emptyState}>
        <Link href="/bikes">公開バイク一覧に戻る</Link>
      </section>
    </div>
  )
}

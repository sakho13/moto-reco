import Link from 'next/link'
import { prisma } from '@repo/database'
import { createMyUserBikeId } from '@repo/shared-types'
import styles from './page.module.css'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'
import { APP_NAME } from '@/lib/statics'

export const metadata = {
  title: `${APP_NAME} | 公開バイク詳細`,
  description: `${APP_NAME}で公開されているバイクの詳細ページです。`,
}

export const revalidate = 300

const getPublicBike = async (id: string) => {
  const repo = new PrismaMyUserBikeRepository(prisma)
  return repo.findPublicBikeById(createMyUserBikeId(id))
}

export default async function PublicBikeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const bike = await getPublicBike(id)

  if (!bike) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>公開バイクが見つかりません</h1>
          <p className={styles.subtitle}>
            指定されたバイクは公開されていないか削除されています。
          </p>
        </header>

        <div className={styles.emptyState}>
          <Link href="/bikes">公開バイク一覧に戻る</Link>
        </div>
      </div>
    )
  }

  const title =
    bike.nickname ||
    `${bike.manufacturerName ?? ''} ${bike.modelName ?? '不明なバイク'}`.trim()
  const subtitle = `${bike.displacement}cc${bike.modelYear ? ` / ${bike.modelYear}年式` : ''}`

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
        <div className={styles.pair}>
          <span className={styles.label}>最終更新日</span>
          <span>{bike.updatedAt.toLocaleDateString('ja-JP')}</span>
        </div>
      </section>

      <section className={styles.emptyState}>
        <p>詳細情報は順次拡充予定です。</p>
        <Link href="/bikes">公開バイク一覧に戻る</Link>
      </section>
    </div>
  )
}

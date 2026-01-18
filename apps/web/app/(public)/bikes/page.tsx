import { prisma } from '@repo/database'
import styles from './page.module.css'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'

export const metadata = {
  title: '公開バイク一覧 | moto-reco',
  description: 'moto-recoで公開されているバイク情報の一覧です。',
}

export const revalidate = 300

const getPublicBikes = async () => {
  const repo = new PrismaMyUserBikeRepository(prisma)
  return repo.findPublicBikes()
}

export default async function PublicBikesPage() {
  const bikes = await getPublicBikes()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>公開バイク一覧</h1>
        <p className={styles.description}>
          公開設定されたバイクのみを表示しています。ユーザープロフィールは公開しません。
        </p>
      </header>

      {bikes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>現在公開されているバイク情報はありません。</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {bikes.map((bike) => {
            const title =
              bike.nickname ||
              `${bike.manufacturerName ?? ''} ${bike.modelName ?? '不明なバイク'}`.trim()
            const subtitle = `${bike.displacement}cc${bike.modelYear ? ` / ${bike.modelYear}年式` : ''}`

            return (
              <article key={bike.myUserBikeId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{title}</h2>
                  <p className={styles.cardSubtitle}>{subtitle}</p>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.metric}>
                    総走行距離: {bike.totalMileage.toLocaleString()} km
                  </div>
                  <div className={styles.updatedAt}>
                    更新日: {bike.updatedAt.toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

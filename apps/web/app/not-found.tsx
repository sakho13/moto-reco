import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className={styles.description}>
        お探しのページは存在しないか、移動された可能性があります。
      </p>
      <div className={styles.actions}>
        <Link href="/" className={styles.primaryButton}>
          ホームへ戻る
        </Link>
      </div>
    </div>
  )
}

import styles from './page.module.css'
import { APP_NAME } from '@/lib/statics'

export const metadata = {
  title: `このアプリについて | ${APP_NAME}`,
  description: `${APP_NAME} についての機能を紹介します。バイクのメンテナンス管理を簡単に行うためのアプリです。`,
}

export default function FaqPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>このアプリについて</h1>
        <p className={styles.description}>
          {APP_NAME} は、バイクのメンテナンス管理を簡単に行うためのアプリです。
        </p>
      </header>

      <div></div>
    </div>
  )
}

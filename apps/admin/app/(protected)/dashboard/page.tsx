import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/statics'

export const metadata: Metadata = {
  title: `ダッシュボード | ${APP_NAME}`,
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>
      <p className="text-muted-foreground">管理機能は順次追加予定です。</p>
    </div>
  )
}

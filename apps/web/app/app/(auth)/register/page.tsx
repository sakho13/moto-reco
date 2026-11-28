import type { Metadata } from 'next'
import { RegisterCard } from '@/components/RegisterCard'
import { createScreenTitle } from '@/lib/screenTitle'

export const metadata: Metadata = {
  title: createScreenTitle('新規登録'),
}

/**
 * 新規登録ページ
 *
 * @remarks
 * メール/パスワードとGoogleでの新規登録をサポート。
 * バリデーション、Firebase Authentication、API呼び出しを実行。
 */
export default function RegisterPage() {
  return <RegisterCard />
}

import type { Metadata } from 'next'
import { ResetPasswordCard } from '@/components/ResetPasswordCard'
import { createScreenTitle } from '@/lib/screenTitle'

export const metadata: Metadata = {
  title: createScreenTitle('パスワード再設定'),
}

/**
 * パスワード再設定ページ
 *
 * @remarks
 * メールアドレス宛にパスワード再設定メールを送信する。
 */
export default function ResetPasswordPage() {
  return <ResetPasswordCard />
}

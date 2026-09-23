'use client'

import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'

/**
 * ヘッダーに置く設定（プロフィール）への導線
 *
 * @remarks
 * Issue #575 でタブから「プロフィール」を外した代わりに、ホームのヘッダーへ
 * 置いた歯車アイコン。`/app/profile` のURL自体は変更していない。
 */
export function SettingsButton() {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="cloud"
      size="sm"
      onClick={() => router.push('/app/profile')}
      aria-label="設定"
      title="設定"
      style={{ width: '2rem', padding: 0 }}
    >
      <Settings size={20} strokeWidth={2} aria-hidden="true" />
    </Button>
  )
}

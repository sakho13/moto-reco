'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import styles from './BikePrimaryAction.module.css'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

type Props = {
  bikeId: string
  fuelLogCount: number
  isGuest: boolean
}

/**
 * 愛車詳細の主アクション（Issue #575「04 画面案」e）
 *
 * @remarks
 * 「1画面に主アクションは1つ」という設計原則（Issue #575）に基づき、
 * この画面から給油を記録できるようにする。`components/home/HomeActions.tsx`
 * と同じ `FuelLogRegisterModal` を使う。
 * 登録成功時は給油履歴・燃費インサイトのSWRキーはモーダル内で再検証されるが、
 * このページが個別に購読しているバイク詳細（現在ODO・給油回数）と
 * バイク一覧（ヘッダーのアクティブ車両表示）は再検証されないため、ここで明示的に行う。
 */
export function BikePrimaryAction({ bikeId, fuelLogCount, isGuest }: Props) {
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)

  const isAtGuestFuelLimit =
    isGuest && fuelLogCount >= GUEST_ACCOUNT_LIMITS.FUEL_LOG

  return (
    <div className={styles.container} data-testid="bike-primary-action">
      {isFuelModalOpen && (
        <FuelLogRegisterModal
          bikeId={bikeId}
          onClose={() => setIsFuelModalOpen(false)}
          onSuccess={() => {
            setIsFuelModalOpen(false)
            void mutate(`/api/v1/user-bike/bike/${bikeId}`)
            void mutate('/api/v1/user-bike/bikes')
          }}
        />
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isAtGuestFuelLimit}
        onClick={() => setIsFuelModalOpen(true)}
      >
        <span className={styles.buttonContent}>
          <FuelIcon />
          給油を記録
        </span>
      </Button>
      {isAtGuestFuelLimit && (
        <p className={styles.limitNote}>
          ゲストアカウントは給油履歴を{GUEST_ACCOUNT_LIMITS.FUEL_LOG}
          件まで登録できます。
        </p>
      )}
    </div>
  )
}

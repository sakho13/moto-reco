'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import styles from './WriteMoreActions.module.css'
import { WrenchIcon } from '@/components/icons/WrenchIcon'
import { MaintenanceLogRegisterModal } from '@/components/maintenance-log/MaintenanceLogRegisterModal'
import { mutateMaintenanceSchedule } from '@/lib/api/mutateHistory'
import { useActiveBike } from '@/lib/hooks/useActiveBike'

/**
 * ホーム「今日」見開き（PC）の「書き足す」レール ─ 給油・ツーリング以外
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」。給油・ツーリングは既存の `HomeActions` を
 * そのままレールに配置するため、ここでは整備の記入だけを追加する。
 * 画面案には「写真を貼る」も含まれるが、写真をワンタップで追加できる
 * 既存の入口（モーダル等）が無く、新規に作ると本Issueのスコープ（ホーム）を
 * 超えるため見送った。モバイルでは表示しない（PC専用）。
 */
export function WriteMoreActions() {
  const { activeBike } = useActiveBike()
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)

  if (!activeBike) return null

  return (
    <div className={styles.list}>
      {isMaintenanceModalOpen && (
        <MaintenanceLogRegisterModal
          bikeId={activeBike.myUserBikeId}
          onClose={() => setIsMaintenanceModalOpen(false)}
          onSuccess={() => {
            setIsMaintenanceModalOpen(false)
            // MaintenanceLogRegisterModal は自身の呼び出し元向けのキーしか
            // 再検証しないため、「点検の予定」レールの分はここで明示的に行う
            void mutateMaintenanceSchedule(activeBike.myUserBikeId)
          }}
        />
      )}

      <Button
        type="button"
        variant="cloud"
        outline
        fullWidth
        onClick={() => setIsMaintenanceModalOpen(true)}
      >
        <span className={styles.buttonContent}>
          <WrenchIcon />
          整備を記録
        </span>
      </Button>
    </div>
  )
}

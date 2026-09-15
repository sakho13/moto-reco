'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './RecordButton.module.css'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { useActiveBike } from '@/lib/hooks/useActiveBike'

type RecordButtonProps = {
  /** ラベルを表示するか（モバイルの下部ナビでtrue、デスクトップのサイドバーでfalse） */
  showLabel?: boolean
  /**
   * 表示バリアント
   * - `nav`: モバイル下部ナビ中央のせり出したボタン（既定）
   * - `sidebar`: デスクトップサイドバーの縦積みに合わせたボタン
   */
  variant?: 'nav' | 'sidebar'
}

/**
 * ナビゲーション中央の「記録」ボタン
 *
 * @remarks
 * Issue #575 で決まったタブ構成「ホーム／愛車／(記録)／ヒストリー」の中央枠。
 * どの画面からでもアクティブ車両に対する給油シートを開けるようにする。
 * バイク未登録の場合はバイク登録ページへ遷移する。
 */
export function RecordButton({
  showLabel = false,
  variant = 'nav',
}: RecordButtonProps) {
  const router = useRouter()
  const { activeBike, isLoading } = useActiveBike()
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    if (isLoading) return
    if (!activeBike) {
      router.push('/app/bike/register')
      return
    }
    setIsOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${styles.recordButton} ${variant === 'sidebar' ? styles.sidebarVariant : ''}`}
        aria-label="記録"
        title="記録"
      >
        <span className={styles.iconCircle}>
          <FuelIcon />
        </span>
        {showLabel && <span className={styles.label}>記録</span>}
      </button>

      {isOpen && activeBike && (
        <FuelLogRegisterModal
          bikeId={activeBike.myUserBikeId}
          onClose={() => setIsOpen(false)}
          onSuccess={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

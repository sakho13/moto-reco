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
 * タブ構成「ホーム／(記録)／愛車」の中央枠。左右の枠数を揃えて中央に置くことで、
 * 画面の実際の中心に来る（{@link navigationItems}参照）。
 * どの画面からでもアクティブ車両に対する給油シートを開けるようにする。
 * バイク未登録の場合はバイク登録ページへ遷移する。
 */
export function RecordButton({
  showLabel = false,
  variant = 'nav',
}: RecordButtonProps) {
  const router = useRouter()
  const { activeBike, bikes, isLoading } = useActiveBike()
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    if (isLoading) return
    if (bikes.length === 0) {
      router.push('/app/bike/register')
      return
    }
    // バイクは存在するがアクティブ車両IDの解決待ち（ActiveBikeProviderの
    // useEffectが未反映）の一瞬だけ activeBike が null になりうる。
    // ここで誤ってバイク登録へ飛ばさないよう、何もせず次のクリックを待つ。
    if (!activeBike) return
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

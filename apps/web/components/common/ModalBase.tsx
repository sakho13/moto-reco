'use client'

import { useEffect } from 'react'
import { Button } from '@repo/ui/button'
import styles from './ModalBase.module.css'
import { XIcon } from '@/components/icons/XIcon'

// ネストしたモーダルで scroll lock が解除されないようカウンタで管理する
let scrollLockCount = 0
let savedScrollY = 0

interface ModalBaseProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  /**
   * モーダルの最大幅バリアント
   *
   * @remarks
   * `lg` はPC幅（1024px〜）専用の2カラムコンテンツ（例: 給油記入票）向け。
   * 768〜1023pxでは `md` と同じ幅のまま（`ModalBase.module.css` 参照）。
   */
  size?: 'md' | 'sm' | 'lg'
  /**
   * PC幅（1024px〜）で `title` の見出し表示を隠すか
   *
   * @remarks
   * 子要素（`children`）側が独自の見出し（例: 給油記入票の「給油記入票」＋
   * 車両チップ＋日時チップ）を持ち、`ModalBase` のタイトルと二重表示になって
   * しまう場合に指定する。閉じるボタン（✕）は幅に関わらず常に表示する。
   * 見出しを視覚的に隠しても `dialog` のアクセシブルネームが失われないよう、
   * このフラグが立っている間は常に `title` を `aria-label` として `dialog` に
   * 設定する（表示上の見出しが子要素側に代わるだけで、読み上げ名は一貫して
   * `title` の値のままになる）。
   * 省略時（既定 `false`）は既存の挙動（常にタイトルを表示）のまま変わらない。
   */
  hideTitleOnDesktop?: boolean
}

export function ModalBase({
  title,
  onClose,
  children,
  size = 'md',
  hideTitleOnDesktop = false,
}: ModalBaseProps) {
  useEffect(() => {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollY}px`
      document.body.style.width = '100%'
    }
    scrollLockCount++
    return () => {
      scrollLockCount--
      if (scrollLockCount === 0) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, savedScrollY)
      }
    }
  }, [])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${size === 'sm' ? styles.modalSm : ''} ${size === 'lg' ? styles.modalLg : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={hideTitleOnDesktop ? title : undefined}
      >
        <div className={styles.header}>
          <h2
            className={`text-lg font-semibold ${hideTitleOnDesktop ? styles.titleHiddenOnDesktop : ''}`}
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="quiet"
            size="iconSm"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

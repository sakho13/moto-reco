'use client'

import { ChevronRight } from 'lucide-react'
import type { ApiResponseUserGoodsDetail } from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import styles from './GoodsCard.module.css'
import { GOODS_CATEGORY_LABELS } from './goodsCategoryLabels'

export interface GoodsCardProps {
  goods: ApiResponseUserGoodsDetail
  onClick?: (userGoodsId: string) => void
}

/**
 * ユーザーが購入したグッズ1件を表示するカード
 *
 * @remarks
 * `onClick` を渡した場合、カード全体をタップして編集モーダルを開ける（給油履歴と同様の操作感）
 */
export const GoodsCard = ({ goods, onClick }: GoodsCardProps) => {
  const { amazonUrl, rakutenUrl, officialUrl } = goods
  const hasLinks = amazonUrl || rakutenUrl || officialUrl
  const handleClick = () => onClick?.(goods.userGoodsId)

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick ? (e) => e.key === 'Enter' && handleClick() : undefined
      }
    >
      <div className={styles.content}>
        <div className={styles.mainRow}>
          <span className={styles.category}>
            {GOODS_CATEGORY_LABELS[goods.category]}
          </span>
          <span className={styles.name}>
            {goods.manufacturerName} {goods.modelName}
          </span>
        </div>

        {(goods.purchasedAt || goods.price !== null) && (
          <div className={styles.detailsRow}>
            {goods.purchasedAt && (
              <span>購入日: {formatDate(goods.purchasedAt)}</span>
            )}
            {goods.purchasedAt && goods.price !== null && (
              <span className={styles.separator}>|</span>
            )}
            {goods.price !== null && (
              <span>¥{goods.price.toLocaleString()}</span>
            )}
          </div>
        )}

        {goods.memo && (
          <div className={styles.memoRow}>
            <span className={styles.memoLabel}>メモ:</span>
            <span className={styles.memoText}>{goods.memo}</span>
          </div>
        )}

        {hasLinks && (
          <div className={styles.footerRow}>
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                公式サイトで見る
              </a>
            )}
            {amazonUrl && (
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                Amazonで見る
              </a>
            )}
            {rakutenUrl && (
              <a
                href={rakutenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={(e) => e.stopPropagation()}
              >
                楽天で見る
              </a>
            )}
          </div>
        )}
      </div>

      {onClick && <ChevronRight className={styles.chevron} />}
    </div>
  )
}

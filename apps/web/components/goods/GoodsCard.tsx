'use client'

import type { ApiResponseUserGoodsDetail } from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import styles from './GoodsCard.module.css'
import { GOODS_CATEGORY_LABELS } from './goodsCategoryLabels'

export interface GoodsCardProps {
  goods: ApiResponseUserGoodsDetail
  onEdit?: (userGoodsId: string) => void
  onDelete?: (userGoodsId: string) => void
}

/**
 * ユーザーが購入したグッズ1件を表示するカード
 *
 * @remarks
 * `onEdit`/`onDelete` は任意。呼び出し元が渡した場合のみ操作ボタンを表示する。
 */
export const GoodsCard = ({ goods, onEdit, onDelete }: GoodsCardProps) => {
  const { amazonUrl, rakutenUrl, officialUrl } = goods
  const hasFooter = amazonUrl || rakutenUrl || officialUrl || onEdit || onDelete

  return (
    <div className={styles.card}>
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
          {goods.price !== null && <span>¥{goods.price.toLocaleString()}</span>}
        </div>
      )}

      {goods.memo && (
        <div className={styles.memoRow}>
          <span className={styles.memoLabel}>メモ:</span>
          <span className={styles.memoText}>{goods.memo}</span>
        </div>
      )}

      {hasFooter && (
        <div className={styles.footerRow}>
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
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
            >
              楽天で見る
            </a>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(goods.userGoodsId)}
              variant="cloud"
              size="sm"
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(goods.userGoodsId)}
              variant="danger"
              size="sm"
            >
              削除
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

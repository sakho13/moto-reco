'use client'

import type { ApiResponseGoodsModelSearch } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './GoodsCatalogItem.module.css'
import { GOODS_CATEGORY_LABELS } from './goodsCategoryLabels'

type GoodsModel = ApiResponseGoodsModelSearch['models'][number]

export interface GoodsCatalogItemProps {
  model: GoodsModel
  onSelect: (model: GoodsModel) => void
}

/**
 * グッズカタログ検索結果1件分のカード
 *
 * @remarks
 * 「これを登録する」ボタン押下で `onSelect` を呼び出し、購入情報入力モーダルを開く。
 */
export const GoodsCatalogItem = ({
  model,
  onSelect,
}: GoodsCatalogItemProps) => {
  const { amazonUrl, rakutenUrl, officialUrl } = model

  return (
    <div className={styles.card}>
      <div className={styles.mainRow}>
        <span className={styles.category}>
          {GOODS_CATEGORY_LABELS[model.category]}
        </span>
        <span className={styles.name}>{model.name}</span>
        <span className={styles.meta}>
          {model.manufacturerName} / {model.modelNumber}
        </span>
      </div>

      {(amazonUrl || rakutenUrl || officialUrl) && (
        <div className={styles.linksRow}>
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
        </div>
      )}

      <Button onClick={() => onSelect(model)} variant="primary" size="sm">
        これを登録する
      </Button>
    </div>
  )
}

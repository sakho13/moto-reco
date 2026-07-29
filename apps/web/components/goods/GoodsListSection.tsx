'use client'

import type { ApiResponseUserGoodsDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { GoodsCard } from './GoodsCard'
import styles from './GoodsListSection.module.css'
import { PlusIcon } from '@/components/icons/PlusIcon'

export interface GoodsListSectionProps {
  /**
   * カードのタイトル
   */
  title: string

  /**
   * ルートコンテナへ付与する data-testid
   */
  testId: string

  /**
   * 表示するグッズのリスト
   */
  goodsList: ApiResponseUserGoodsDetail[]

  /**
   * グッズ登録導線クリック時のコールバック
   */
  onRegister: () => void

  /**
   * 登録ボタンのラベル
   * @default 'グッズを追加'
   */
  registerLabel?: string

  /**
   * さらにグッズを読み込むボタンクリック時のコールバック
   */
  onLoadMore?: () => void

  /**
   * 追加読み込みが可能かどうか
   */
  canLoadMore?: boolean

  /**
   * 追加読み込み中かどうか
   */
  isLoadingMore?: boolean

  /**
   * 空状態のメッセージ
   * @default 'グッズがまだ登録されていません'
   */
  emptyMessage?: string
}

/**
 * ユーザーの購入グッズ一覧を表示する再利用可能なセクション
 *
 * @remarks
 * `/goods` 一覧ページ、マイバイク詳細ページの「取り付けアクセサリ」の両方から利用する。
 */
export const GoodsListSection = ({
  title,
  testId,
  goodsList,
  onRegister,
  registerLabel = 'グッズを追加',
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  emptyMessage = 'グッズがまだ登録されていません',
}: GoodsListSectionProps) => {
  return (
    <BaseCard
      title={title}
      data-testid={testId}
      headerAction={
        <Button
          onClick={onRegister}
          variant="cloud"
          size="sm"
          aria-label={registerLabel}
          title={registerLabel}
        >
          <PlusIcon />
        </Button>
      }
    >
      {goodsList.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {goodsList.map((goods) => (
            <GoodsCard key={goods.userGoodsId} goods={goods} />
          ))}
          {canLoadMore && onLoadMore && (
            <div className={styles.loadMore}>
              <Button
                onClick={onLoadMore}
                variant="cloud"
                loading={isLoadingMore}
              >
                もっと見る
              </Button>
            </div>
          )}
        </div>
      )}
    </BaseCard>
  )
}

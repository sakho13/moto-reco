'use client'

import { useState } from 'react'
import type { ApiResponseUserBikeDetail } from '@repo/shared-types'
import { formatDate, getCurrentDate, isUnsetDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import styles from './BikeHeroSection.module.css'
import { MyBikeEditModal } from './MyBikeEditModal'
import { EditIcon } from '@/components/icons/EditIcon'
import { getBikeDisplayName } from '@/lib/bike'

const UNSET = '未設定'

type Props = {
  bike: ApiResponseUserBikeDetail
}

/**
 * 所有期間を「○年○ヶ月」形式の文字列にする
 *
 * @remarks
 * 購入日が未設定の場合は算出根拠が無いため「未設定」を返す。
 * 1ヶ月未満の場合は「1ヶ月未満」とする。
 * 「ヶ月」表記はアプリ内の他の月数表示（`BikeCarteControls` の期間選択肢、
 * 整備間隔の「◯ヶ月毎」等）と揃えている（「か月」表記とは混在させない）。
 */
function formatOwnershipDuration(purchaseDate: string | null): string {
  if (!purchaseDate || isUnsetDate(purchaseDate)) return UNSET

  const start = new Date(purchaseDate)
  const now = getCurrentDate()

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 0) return UNSET

  if (months < 1) return '1ヶ月未満'

  const years = Math.floor(months / 12)
  const remainMonths = months % 12

  if (years === 0) return `${remainMonths}ヶ月`
  if (remainMonths === 0) return `${years}年`
  return `${years}年${remainMonths}ヶ月`
}

/**
 * 愛車の見出しと車両情報（Issue #575「04 画面案」a）
 *
 * @remarks
 * 総走行距離・排気量・購入日という登録情報の再掲だが、枠付きカードの羅列ではなく
 * 罫線で区切った2列のリストにする（「03 再設計の原則」手帳であって管理画面ではない）。
 */
export function BikeHeroSection({ bike }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const displayName = getBikeDisplayName(bike)
  const subtitleParts = [
    bike.displacement ? `${bike.displacement}cc` : null,
    bike.modelYear ? `${bike.modelYear}年式` : null,
  ].filter((part): part is string => part !== null)

  const specRows: { label: string; value: string }[] = [
    {
      label: '購入日',
      value:
        bike.purchaseDate && !isUnsetDate(bike.purchaseDate)
          ? formatDate(bike.purchaseDate)
          : UNSET,
    },
    {
      label: '購入時ODO',
      value:
        bike.purchaseMileage !== null
          ? `${bike.purchaseMileage.toLocaleString()} km`
          : UNSET,
    },
    {
      label: '現在ODO',
      value: `${bike.totalMileage.toLocaleString()} km`,
    },
    {
      label: '購入価格',
      value:
        bike.purchasePrice !== null
          ? `¥${bike.purchasePrice.toLocaleString()}`
          : UNSET,
    },
    {
      label: '所有期間',
      value: formatOwnershipDuration(bike.purchaseDate),
    },
  ]

  return (
    <section className={styles.section} data-testid="bike-hero-section">
      {isEditModalOpen && (
        <MyBikeEditModal
          bikeId={bike.myUserBikeId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => setIsEditModalOpen(false)}
        />
      )}

      <div className={styles.heading}>
        <div>
          <h1 className={styles.name}>{displayName}</h1>
          {subtitleParts.length > 0 && (
            <p className={styles.subtitle}>{subtitleParts.join(' ・ ')}</p>
          )}
        </div>
        <Button
          type="button"
          variant="cloud"
          size="icon"
          aria-label="愛車情報を編集"
          onClick={() => setIsEditModalOpen(true)}
        >
          <EditIcon />
        </Button>
      </div>

      <dl className={styles.spec}>
        {specRows.map((row) => (
          <div key={row.label} className={styles.specRow}>
            <dt className={styles.specLabel}>{row.label}</dt>
            <dd className={styles.specValue}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

'use client'

import type { ApiResponseTouringPlanListItem } from '@repo/shared-types'
import styles from './TouringPlanLedgerList.module.css'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatWeekday(dateString: string): string {
  return WEEKDAYS[new Date(dateString).getDay()] ?? ''
}

function formatMonthDay(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

type TouringPlanLedgerRowProps = {
  plan: ApiResponseTouringPlanListItem
  onSelect: (touringPlanId: string) => void
}

function TouringPlanLedgerRow({ plan, onSelect }: TouringPlanLedgerRowProps) {
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onSelect(plan.touringPlanId)}
      >
        <span className={styles.date}>
          <span className={styles.dateWeekday}>
            {formatWeekday(plan.updatedAt)}
          </span>
          <span className={styles.dateDay}>
            {formatMonthDay(plan.updatedAt)}
          </span>
        </span>

        <span className={styles.body}>
          <span className={styles.title}>{plan.title}</span>
          {plan.destination?.name && (
            <span className={styles.detailLine}>
              目的地: {plan.destination.name}
            </span>
          )}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  )
}

type Props = {
  plans: ApiResponseTouringPlanListItem[]
  onSelect: (touringPlanId: string) => void
}

/**
 * ツーリングプランの台帳（行リスト）の表示部品（Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/touring-plans` のPC版一覧から使う。`FuelLedgerList` と
 * 同じ罫線区切り・枠なしの行構成にする。プランは走行距離・燃費のような
 * 導出値を持たないため、値欄は他の台帳（給油・ツーリング・メンテナンス）と
 * 異なりシェブロンのみ（次の行動＝詳細を開く、を示すだけに留める）。
 * 日付は更新日時（モバイル版 `PlanCard` の「更新: …」と同じ情報源）を使う。
 *
 * 空状態・件数見出しは持たない。プラン一覧APIはキーワード検索・
 * ページネーションを持たないため、呼び出し側（`touring-plans/page.tsx`）が
 * 0件時にメッセージを1箇所だけ表示する構成になっており、本コンポーネントは
 * 1件以上ある場合にのみ描画される。
 */
export function TouringPlanLedgerList({ plans, onSelect }: Props) {
  return (
    <ul className={styles.list} data-testid="touring-plan-ledger-section">
      {plans.map((plan) => (
        <TouringPlanLedgerRow
          key={plan.touringPlanId}
          plan={plan}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getNowLocalDateTimeString } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Textarea } from '@repo/ui/textarea'
import { ToggleSection } from '@repo/ui/toggleSection'
import styles from './FuelLogRegisterSheet.module.css'
import { NumericKeypad } from './NumericKeypad'
import {
  appendNumericKey,
  calculateFuelEfficiencyComparison,
  calculateLiveGauges,
  formatFuelEfficiencyComparisonNote,
  formatIntegerDisplay,
  formatPreviousStubHeading,
  formatRefueledAtChipLabel,
  FUEL_EFFICIENCY_STATUS_MESSAGES,
  parseFieldNumber,
  sanitizeNumericInput,
  shouldUpdateTotalMileage,
  type NumericFieldConstraints,
  type PreviousFuelLogDetail,
} from '@/lib/fuelLogSheet'

export interface FuelLogRegisterSheetSubmitValues {
  refueledAt: string
  mileage: number
  amount: number
  totalPrice: number
  isFullTank: boolean
  memo: string
}

export interface FuelLogRegisterSheetProps {
  /** 車両名（PC版ヘッダーの車両チップに表示。取得前は null） */
  vehicleName: string | null
  /** 直近の給油履歴（無ければ初回給油） */
  previousFuelLog: PreviousFuelLogDetail | null
  /** 直近数件の平均燃費（PC版控え欄の「平均より」比較に使用。算出不可なら null） */
  averageFuelEfficiency: number | null
  /**
   * `averageFuelEfficiency` の母数（直近何件を平均したか）
   *
   * @remarks
   * PC版控え欄の「直近N回の平均より」の文言に反映する。愛車画面の「平均燃費」
   * （期間フィルタ全体が母数）と母数が異なるため、母数を明示して数値の
   * 食い違いに見えないようにする。呼び出し元（`FuelLogRegisterModal`）の
   * `RECENT_FUEL_LOG_COUNT` をそのまま渡す。
   */
  recentAverageCount: number
  /** 現在の総走行距離（PC版控え欄の更新後の値の案内に使用） */
  currentTotalMileage: number | undefined
  /** ツーリング中に開いた場合、自動で紐づく旨を表示する */
  hasTouring: boolean
  isSubmitting: boolean
  error: string
  onSubmit: (values: FuelLogRegisterSheetSubmitValues) => Promise<void>
  /** PC版の「やめる」ボタンから呼ばれる */
  onClose: () => void
}

type FieldKey = 'mileage' | 'amount' | 'totalPrice'

const FIELD_CONSTRAINTS: Record<FieldKey, NumericFieldConstraints> = {
  mileage: { allowDecimal: false, maxIntegerDigits: 7, maxDecimalDigits: 0 },
  amount: { allowDecimal: true, maxIntegerDigits: 3, maxDecimalDigits: 2 },
  totalPrice: { allowDecimal: false, maxIntegerDigits: 7, maxDecimalDigits: 0 },
}

const COMPACT_MEDIA_QUERY = '(max-width: 640px)'
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

/**
 * 給油シート（登録用）
 *
 * @remarks
 * ガソリンスタンドで片手・グローブ・15秒での記録を目的とした専用UI。
 * 入力はODO・給油量・支払金額の3項目のみ。狭幅（〜640px）では専用テンキーを表示し、
 * OSキーボードを介さずに「次へ」で連続入力できるようにする。
 * 641px以上では専用テンキーを出さず、通常の数値入力（Tab送り・Enter保存）にする。
 *
 * PC幅（1024px〜）では見た目の器だけを「給油記入票」（伝票）に差し替える
 * （Issue #575「05 画面案 ─ PC」給油記入票）。状態・バリデーション・ライブ計器の
 * 算出ロジックはモバイルと完全に共通で、`isDesktop` によって描画するJSXの
 * ツリーを丸ごと切り替えるだけにとどめている（ロジックの二重実装を避けるため）。
 */
export function FuelLogRegisterSheet({
  vehicleName,
  previousFuelLog,
  averageFuelEfficiency,
  recentAverageCount,
  currentTotalMileage,
  hasTouring,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: FuelLogRegisterSheetProps) {
  const [refueledAt, setRefueledAt] = useState(() =>
    getNowLocalDateTimeString(1)
  )
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false)
  const [mileageRaw, setMileageRaw] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [totalPriceRaw, setTotalPriceRaw] = useState('')
  const [isFullTank, setIsFullTank] = useState(true)
  const [memo, setMemo] = useState('')
  const [activeField, setActiveField] = useState<FieldKey>('mileage')
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(COMPACT_MEDIA_QUERY).matches
  })
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })

  const formRef = useRef<HTMLFormElement>(null)
  const mileageRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const totalPriceRef = useRef<HTMLInputElement>(null)
  const fieldRefs: Record<
    FieldKey,
    React.RefObject<HTMLInputElement | null>
  > = {
    mileage: mileageRef,
    amount: amountRef,
    totalPrice: totalPriceRef,
  }

  // 開いた瞬間から最初の数字が打てるよう、走行距離欄にフォーカスする。
  // isDesktop の判定はマウント後（useEffect）に確定するため、モバイル/PCで
  // JSXツリーが丸ごと入れ替わる（＝inputのDOMノードが作り直される）と
  // フォーカスが失われる。isDesktop の確定・変化のたびに再フォーカスする。
  useEffect(() => {
    mileageRef.current?.focus()
  }, [isDesktop])

  // 狭幅かどうかをJSでも判定する（readOnly/inputModeの切り替えにはCSSだけでは不十分なため）
  useEffect(() => {
    const mql = window.matchMedia(COMPACT_MEDIA_QUERY)
    setIsCompact(mql.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsCompact(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  // PC幅（1024px〜）かどうかをJSでも判定する。「給油記入票」への丸ごと差し替えの判定に使う。
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    setIsDesktop(mql.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const rawValues: Record<FieldKey, string> = {
    mileage: mileageRaw,
    amount: amountRaw,
    totalPrice: totalPriceRaw,
  }
  const setRawValues: Record<
    FieldKey,
    React.Dispatch<React.SetStateAction<string>>
  > = {
    mileage: setMileageRaw,
    amount: setAmountRaw,
    totalPrice: setTotalPriceRaw,
  }

  const applyKey = (field: FieldKey, key: string) => {
    if (isSubmitting) return
    const constraints = FIELD_CONSTRAINTS[field]
    setRawValues[field]((current) =>
      appendNumericKey(current, key, constraints)
    )
  }

  const advance = (field: FieldKey) => {
    if (field === 'mileage') {
      amountRef.current?.focus()
    } else if (field === 'amount') {
      totalPriceRef.current?.focus()
    } else {
      formRef.current?.requestSubmit()
    }
  }

  const handleFieldKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: FieldKey
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      advance(field)
      return
    }
    // 641px以上（通常の数値入力）は、ブラウザ標準の編集・Tab移動に任せる
    if (!isCompact) return
    if (e.key === 'Tab') return

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      applyKey(field, e.key)
      return
    }
    if (e.key === '.') {
      e.preventDefault()
      applyKey(field, '.')
      return
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      applyKey(field, 'backspace')
    }
  }

  const handleFieldChange = (field: FieldKey, value: string) => {
    if (isCompact) return // readOnlyのためテンキー/物理キー経由のみ反映する
    const constraints = FIELD_CONSTRAINTS[field]
    setRawValues[field](sanitizeNumericInput(value, constraints))
  }

  const mileageNum = parseFieldNumber(mileageRaw)
  const amountNum = parseFieldNumber(amountRaw)
  const totalPriceNum = parseFieldNumber(totalPriceRaw)

  const liveGauge = useMemo(
    () =>
      calculateLiveGauges({
        mileage: mileageNum,
        amount: amountNum,
        totalPrice: totalPriceNum,
        isFullTank,
        previousLog: previousFuelLog,
      }),
    [mileageNum, amountNum, totalPriceNum, isFullTank, previousFuelLog]
  )

  const fuelEfficiencyComparison = useMemo(
    () =>
      calculateFuelEfficiencyComparison({
        currentFuelEfficiency: liveGauge.fuelEfficiency,
        previousFuelEfficiency: previousFuelLog?.fuelEfficiency ?? null,
        averageFuelEfficiency,
      }),
    [liveGauge.fuelEfficiency, previousFuelLog, averageFuelEfficiency]
  )
  const comparisonNote = formatFuelEfficiencyComparisonNote(
    fuelEfficiencyComparison,
    recentAverageCount
  )

  const totalMileageNote =
    mileageNum !== null &&
    shouldUpdateTotalMileage(mileageNum, currentTotalMileage)
      ? `記録すると、総走行距離が ${mileageNum.toLocaleString('ja-JP')} km に更新されます。`
      : currentTotalMileage !== undefined
        ? `現在の総走行距離: ${currentTotalMileage.toLocaleString('ja-JP')} km`
        : null

  const canSubmit =
    mileageNum !== null &&
    amountNum !== null &&
    amountNum > 0 &&
    totalPriceNum !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return
    await onSubmit({
      refueledAt,
      mileage: mileageNum as number,
      amount: amountNum as number,
      totalPrice: totalPriceNum as number,
      isFullTank,
      memo,
    })
  }

  /** フィールドの表示値・制約をまとめる（入力欄のJSXはモバイル/PCで別々に組むが、値の算出ロジックはここに集約する） */
  const getFieldDisplay = (field: FieldKey) => {
    const constraints = FIELD_CONSTRAINTS[field]
    const raw = rawValues[field]
    const displayValue =
      isCompact && !constraints.allowDecimal ? formatIntegerDisplay(raw) : raw
    return { constraints, displayValue }
  }

  const renderFieldInput = (params: {
    field: FieldKey
    id: string
    placeholder?: string
    className: string
  }) => {
    const { field, id, placeholder = '0', className } = params
    const { constraints, displayValue } = getFieldDisplay(field)

    return (
      <input
        id={id}
        ref={fieldRefs[field]}
        type="text"
        inputMode={
          isCompact ? 'none' : constraints.allowDecimal ? 'decimal' : 'numeric'
        }
        readOnly={isCompact}
        value={displayValue}
        placeholder={placeholder}
        autoComplete="off"
        disabled={isSubmitting}
        className={className}
        onFocus={() => setActiveField(field)}
        onKeyDown={(e) => handleFieldKeyDown(e, field)}
        onChange={(e) => handleFieldChange(field, e.target.value)}
      />
    )
  }

  const renderTankToggle = () => (
    <div
      className={styles.tankToggle}
      role="group"
      aria-label="満タン・継ぎ足しの切り替え"
    >
      <button
        type="button"
        aria-pressed={isFullTank}
        className={`${styles.tankChip} ${isFullTank ? styles.tankChipActive : ''}`}
        onClick={() => setIsFullTank(true)}
        disabled={isSubmitting}
      >
        満タン
      </button>
      <button
        type="button"
        aria-pressed={!isFullTank}
        className={`${styles.tankChip} ${!isFullTank ? styles.tankChipActive : ''}`}
        onClick={() => setIsFullTank(false)}
        disabled={isSubmitting}
      >
        継ぎ足し
      </button>
    </div>
  )

  const dateChipButton = (
    <button
      type="button"
      className={styles.dateChip}
      aria-expanded={isDateEditorOpen}
      onClick={() => setIsDateEditorOpen((v) => !v)}
      disabled={isSubmitting}
    >
      {formatRefueledAtChipLabel(refueledAt)}
      <span aria-hidden="true" className={styles.dateChipChevron}>
        ▾
      </span>
    </button>
  )

  const dateEditor = isDateEditorOpen && (
    <FormField label="給油日時" htmlFor="fuelSheetRefueledAt">
      <DateTimeInput
        id="fuelSheetRefueledAt"
        value={refueledAt}
        minuteStep={1}
        max={getNowLocalDateTimeString()}
        onChange={(e) => setRefueledAt(e.target.value)}
        disabled={isSubmitting}
      />
    </FormField>
  )

  const renderMobileField = (params: {
    field: FieldKey
    id: string
    label: string
    unit: string
    placeholder?: string
  }) => {
    const { field, id, label, unit, placeholder } = params

    return (
      <div
        className={`${styles.field} ${activeField === field ? styles.fieldActive : ''}`}
      >
        <div className={styles.fieldHeaderRow}>
          <label htmlFor={id} className={styles.fieldLabel}>
            {label}
          </label>
          {field === 'mileage' && (
            <span className={styles.fieldHint}>
              {previousFuelLog
                ? `前回 ${previousFuelLog.mileage.toLocaleString('ja-JP')} km`
                : '初回の記録です'}
            </span>
          )}
          {field === 'amount' && renderTankToggle()}
        </div>

        <div className={styles.fieldBox}>
          {renderFieldInput({
            field,
            id,
            placeholder,
            className: styles.fieldInput,
          })}
          <span className={styles.fieldUnit}>{unit}</span>
        </div>
      </div>
    )
  }

  const renderSlipField = (params: {
    field: FieldKey
    id: string
    label: string
    unit: string
    hint?: string
  }) => {
    const { field, id, label, unit, hint } = params

    return (
      <div
        className={`${styles.slipField} ${activeField === field ? styles.slipFieldActive : ''}`}
      >
        <label htmlFor={id} className={styles.slipFieldLabel}>
          {label}
        </label>
        <div className={styles.slipFieldValueRow}>
          <div className={styles.slipFieldValue}>
            {renderFieldInput({
              field,
              id,
              className: styles.slipFieldInput,
            })}
            <span className={styles.slipFieldUnit}>{unit}</span>
          </div>
          {hint && <span className={styles.slipFieldHint}>{hint}</span>}
        </div>
      </div>
    )
  }

  const renderMobileSheet = () => (
    <>
      <div className={styles.headerRow}>
        {/*
          複数台持ちのとき、モーダルがヘッダー（アクティブ車両表示）を覆うため、
          どのバイクに記録しているかシート上で確認できるよう車両チップを出す
          （PC版の給油記入票と同じ `.chip` を再利用。Issue #575「05 画面案 ─ PC」
          のモバイル案 `✕ 給油 [テスト号 ▾] [今 14:15 ▾]` にも対応する）。
        */}
        {vehicleName && <span className={styles.chip}>{vehicleName}</span>}
        {dateChipButton}
      </div>

      {dateEditor}

      <div className={styles.fieldStack}>
        {renderMobileField({
          field: 'mileage',
          id: 'fuelSheetMileage',
          label: '走行距離 ODO',
          unit: 'km',
        })}
        {renderMobileField({
          field: 'amount',
          id: 'fuelSheetAmount',
          label: '給油量',
          unit: 'L',
        })}
        {renderMobileField({
          field: 'totalPrice',
          id: 'fuelSheetTotalPrice',
          label: '支払金額',
          unit: '円',
        })}
      </div>

      <div className={styles.gaugeRow} data-testid="fuel-log-live-gauge">
        <div className={styles.gaugeCell}>
          <span className={styles.gaugeValue}>
            {liveGauge.intervalKm !== null
              ? liveGauge.intervalKm.toLocaleString('ja-JP')
              : '—'}
          </span>
          <span className={styles.gaugeLabel}>区間 km</span>
        </div>
        <div
          className={`${styles.gaugeCell} ${liveGauge.fuelEfficiency !== null ? styles.gaugeCellHighlight : ''}`}
        >
          <span className={styles.gaugeValue}>
            {liveGauge.fuelEfficiency !== null
              ? liveGauge.fuelEfficiency.toFixed(1)
              : '—'}
          </span>
          <span className={styles.gaugeLabel}>燃費 km/L</span>
        </div>
        <div className={styles.gaugeCell}>
          <span className={styles.gaugeValue}>
            {liveGauge.pricePerLiter !== null
              ? Math.round(liveGauge.pricePerLiter).toLocaleString('ja-JP')
              : '—'}
          </span>
          <span className={styles.gaugeLabel}>単価 円/L</span>
        </div>
      </div>
      {liveGauge.efficiencyStatus !== 'calculated' && (
        <p className={styles.gaugeNote}>
          {FUEL_EFFICIENCY_STATUS_MESSAGES[liveGauge.efficiencyStatus]}
        </p>
      )}

      <ToggleSection title="詳細を追加（メモ・ツーリング）" defaultOpen={false}>
        {hasTouring && (
          <p className={styles.touringNote}>
            現在のツーリングに自動で紐づけて記録します
          </p>
        )}
        <FormField
          label="メモ"
          htmlFor="fuelSheetMemo"
          helperText="最大500文字"
        >
          <Textarea
            id="fuelSheetMemo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={500}
            disabled={isSubmitting}
            placeholder="例: ハイオク満タン"
            rows={3}
          />
        </FormField>
      </ToggleSection>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className={styles.stickyFooter}>
        {isCompact && (
          <NumericKeypad
            decimalDisabled={!FIELD_CONSTRAINTS[activeField].allowDecimal}
            advanceLabel={activeField === 'totalPrice' ? '記録' : '次へ'}
            advanceDisabled={activeField === 'totalPrice' && !canSubmit}
            onDigit={(digit) => applyKey(activeField, digit)}
            onDecimal={() => applyKey(activeField, '.')}
            onBackspace={() => applyKey(activeField, 'backspace')}
            onAdvance={() => advance(activeField)}
          />
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          fullWidth
          loading={isSubmitting}
        >
          {isSubmitting ? '記録中...' : '記録'}
        </Button>
      </div>
    </>
  )

  const renderDesktopSlip = () => (
    <div className={styles.slip}>
      <div className={styles.slipMain}>
        <div className={styles.slipHead}>
          <span className={styles.slipTitle}>給油記入票</span>
          <div className={styles.slipHeadChips}>
            {vehicleName && <span className={styles.chip}>{vehicleName}</span>}
            {dateChipButton}
          </div>
        </div>

        {dateEditor}

        <div className={styles.slipFields}>
          {renderSlipField({
            field: 'mileage',
            id: 'fuelSheetMileage',
            label: '走行距離 ODO',
            unit: 'km',
            hint: previousFuelLog
              ? `前回 ${previousFuelLog.mileage.toLocaleString('ja-JP')}`
              : '初回の記録です',
          })}
          {renderSlipField({
            field: 'amount',
            id: 'fuelSheetAmount',
            label: '給油量',
            unit: 'L',
          })}
          <div className={styles.slipField}>
            <span className={styles.slipFieldLabel}>区分</span>
            <div className={styles.slipFieldValueRow}>
              <div className={styles.slipFieldValue}>{renderTankToggle()}</div>
            </div>
          </div>
          {renderSlipField({
            field: 'totalPrice',
            id: 'fuelSheetTotalPrice',
            label: '支払金額',
            unit: '円',
          })}
          <div className={styles.slipField}>
            <label htmlFor="fuelSheetMemo" className={styles.slipFieldLabel}>
              摘要
            </label>
            <div className={styles.slipFieldValueRow}>
              <div className={styles.slipFieldValue}>
                <textarea
                  id="fuelSheetMemo"
                  className={styles.slipMemoInput}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={500}
                  rows={2}
                  disabled={isSubmitting}
                  placeholder="例: ハイオク満タン"
                />
              </div>
              <span className={styles.slipFieldHint}>{memo.length}/500</span>
            </div>
          </div>
          <div className={styles.slipField}>
            <span className={styles.slipFieldLabel}>ツーリング</span>
            <div className={styles.slipFieldValueRow}>
              <span className={styles.slipTouringNote}>
                {hasTouring
                  ? '現在のツーリングに紐づけて記録します'
                  : '紐づけません'}
              </span>
            </div>
          </div>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className={styles.slipActions}>
          <span className={styles.slipHint}>Tab で次の欄 ／ Enter で記録</span>
          <Button
            type="button"
            variant="cloud"
            outline
            onClick={onClose}
            disabled={isSubmitting}
          >
            やめる
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            loading={isSubmitting}
          >
            {isSubmitting ? '記録中...' : '記録 ⏎'}
          </Button>
        </div>
      </div>

      <aside className={styles.stub} data-testid="fuel-log-slip-stub">
        <div className={styles.stubBlock}>
          <h3 className={styles.stubHeading}>
            {previousFuelLog
              ? formatPreviousStubHeading(previousFuelLog.refueledAt)
              : '前回の控え'}
          </h3>
          {previousFuelLog ? (
            <div className={styles.stubRows}>
              <div className={styles.stubRow}>
                <span>走行距離</span>
                <span>
                  {previousFuelLog.mileage.toLocaleString('ja-JP')} km
                </span>
              </div>
              <div className={styles.stubRow}>
                <span>給油量</span>
                <span>{previousFuelLog.amount.toLocaleString('ja-JP')} L</span>
              </div>
              <div className={styles.stubRow}>
                <span>金額</span>
                <span>
                  ¥{previousFuelLog.totalPrice.toLocaleString('ja-JP')}
                </span>
              </div>
              <div className={styles.stubRow}>
                <span>単価</span>
                <span>
                  {previousFuelLog.pricePerLiter !== null
                    ? `${Math.round(previousFuelLog.pricePerLiter).toLocaleString('ja-JP')} 円/L`
                    : '—'}
                </span>
              </div>
            </div>
          ) : (
            <p className={styles.stubEmpty}>初回の記録です</p>
          )}
        </div>

        <div className={styles.stubBlock}>
          <h3 className={styles.stubHeading}>この記入で決まる値</h3>
          <div className={styles.stubResult} data-testid="fuel-log-live-gauge">
            <div className={styles.stubResultItem}>
              <span className={styles.stubResultLabel}>区間距離</span>
              <span className={styles.stubResultValue}>
                {liveGauge.intervalKm !== null
                  ? liveGauge.intervalKm.toLocaleString('ja-JP')
                  : '—'}
                <em>km</em>
              </span>
            </div>
            <div
              className={
                liveGauge.fuelEfficiency !== null
                  ? `${styles.stubResultItem} ${styles.stubResultItemLead}`
                  : styles.stubResultItem
              }
            >
              <span className={styles.stubResultLabel}>燃費</span>
              <span
                className={
                  liveGauge.fuelEfficiency !== null
                    ? styles.stubResultValue
                    : styles.stubResultValueGhost
                }
              >
                {liveGauge.fuelEfficiency !== null
                  ? liveGauge.fuelEfficiency.toFixed(1)
                  : '—'}
                <em>km/L</em>
              </span>
            </div>
            {comparisonNote ? (
              <p className={styles.stubResultMemo}>{comparisonNote}</p>
            ) : liveGauge.efficiencyStatus !== 'calculated' ? (
              <p className={styles.stubResultMemo}>
                {FUEL_EFFICIENCY_STATUS_MESSAGES[liveGauge.efficiencyStatus]}
              </p>
            ) : null}
            <div className={styles.stubResultItem}>
              <span className={styles.stubResultLabel}>単価</span>
              <span className={styles.stubResultValue}>
                {liveGauge.pricePerLiter !== null
                  ? Math.round(liveGauge.pricePerLiter).toLocaleString('ja-JP')
                  : '—'}
                <em>円/L</em>
              </span>
            </div>
          </div>
        </div>

        {totalMileageNote && (
          <p className={styles.stubFooter}>{totalMileageNote}</p>
        )}
      </aside>
    </div>
  )

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={styles.sheet}
      data-testid="fuel-log-register-sheet"
    >
      {isDesktop ? renderDesktopSlip() : renderMobileSheet()}
    </form>
  )
}

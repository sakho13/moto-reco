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
  calculateLiveGauges,
  formatIntegerDisplay,
  formatRefueledAtChipLabel,
  FUEL_EFFICIENCY_STATUS_MESSAGES,
  parseFieldNumber,
  sanitizeNumericInput,
  type NumericFieldConstraints,
  type PreviousFuelLogSummary,
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
  /** 直近の給油履歴（無ければ初回給油） */
  previousFuelLog: PreviousFuelLogSummary | null
  /** ツーリング中に開いた場合、自動で紐づく旨を表示する */
  hasTouring: boolean
  isSubmitting: boolean
  error: string
  onSubmit: (values: FuelLogRegisterSheetSubmitValues) => Promise<void>
}

type FieldKey = 'mileage' | 'amount' | 'totalPrice'

const FIELD_CONSTRAINTS: Record<FieldKey, NumericFieldConstraints> = {
  mileage: { allowDecimal: false, maxIntegerDigits: 7, maxDecimalDigits: 0 },
  amount: { allowDecimal: true, maxIntegerDigits: 3, maxDecimalDigits: 2 },
  totalPrice: { allowDecimal: false, maxIntegerDigits: 7, maxDecimalDigits: 0 },
}

const COMPACT_MEDIA_QUERY = '(max-width: 640px)'

/**
 * 給油シート（登録用）
 *
 * @remarks
 * ガソリンスタンドで片手・グローブ・15秒での記録を目的とした専用UI。
 * 入力はODO・給油量・支払金額の3項目のみ。狭幅（〜640px）では専用テンキーを表示し、
 * OSキーボードを介さずに「次へ」で連続入力できるようにする。
 * 641px以上では専用テンキーを出さず、通常の数値入力（Tab送り・Enter保存）にする。
 */
export function FuelLogRegisterSheet({
  previousFuelLog,
  hasTouring,
  isSubmitting,
  error,
  onSubmit,
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

  // 開いた瞬間から最初の数字が打てるよう、走行距離欄にフォーカスする
  useEffect(() => {
    mileageRef.current?.focus()
  }, [])

  // 狭幅かどうかをJSでも判定する（readOnly/inputModeの切り替えにはCSSだけでは不十分なため）
  useEffect(() => {
    const mql = window.matchMedia(COMPACT_MEDIA_QUERY)
    setIsCompact(mql.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsCompact(e.matches)
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

  const renderField = (params: {
    field: FieldKey
    id: string
    label: string
    unit: string
    placeholder?: string
  }) => {
    const { field, id, label, unit, placeholder = '0' } = params
    const constraints = FIELD_CONSTRAINTS[field]
    const raw = rawValues[field]
    const displayValue =
      isCompact && !constraints.allowDecimal ? formatIntegerDisplay(raw) : raw

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
          {field === 'amount' && (
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
          )}
        </div>

        <div className={styles.fieldBox}>
          <input
            id={id}
            ref={fieldRefs[field]}
            type="text"
            inputMode={
              isCompact
                ? 'none'
                : constraints.allowDecimal
                  ? 'decimal'
                  : 'numeric'
            }
            readOnly={isCompact}
            value={displayValue}
            placeholder={placeholder}
            autoComplete="off"
            disabled={isSubmitting}
            className={styles.fieldInput}
            onFocus={() => setActiveField(field)}
            onKeyDown={(e) => handleFieldKeyDown(e, field)}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
          <span className={styles.fieldUnit}>{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={styles.sheet}
      data-testid="fuel-log-register-sheet"
    >
      <div className={styles.headerRow}>
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
      </div>

      {isDateEditorOpen && (
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
      )}

      <div className={styles.fieldStack}>
        {renderField({
          field: 'mileage',
          id: 'fuelSheetMileage',
          label: '走行距離 ODO',
          unit: 'km',
        })}
        {renderField({
          field: 'amount',
          id: 'fuelSheetAmount',
          label: '給油量',
          unit: 'L',
        })}
        {renderField({
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
            advanceLabel={activeField === 'totalPrice' ? '記録する' : '次へ'}
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
          {isSubmitting ? '登録中...' : '記録する'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import styles from './NumericKeypad.module.css'

export interface NumericKeypadProps {
  /** 0〜9のいずれかが押された */
  onDigit: (digit: string) => void
  /** "." が押された */
  onDecimal: () => void
  /** ⌫ が押された */
  onBackspace: () => void
  /** 「次へ」/「記録」が押された */
  onAdvance: () => void
  /** 現在フォーカス中のフィールドが小数点を受け付けないか */
  decimalDisabled: boolean
  /** 「次へ」/「記録」ボタンのラベル */
  advanceLabel: string
  /** 「次へ」/「記録」ボタンを無効化するか */
  advanceDisabled?: boolean
}

const DIGIT_ROWS: readonly (readonly string[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

/**
 * 給油シート専用の数値テンキー
 *
 * @remarks
 * OSキーボードの切り替えを挟まず、ODO → 給油量 → 金額 を「次へ」で連続入力できるようにする。
 * タップ対象は44px以上を確保する。フォーカス中の入力欄からフォーカスを奪わないよう、
 * 各ボタンは `onMouseDown` でデフォルト動作（blur）を止めている。
 */
export function NumericKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onAdvance,
  decimalDisabled,
  advanceLabel,
  advanceDisabled = false,
}: NumericKeypadProps) {
  const preventBlur = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  return (
    <div
      className={styles.keypad}
      data-testid="fuel-log-numeric-keypad"
      role="group"
      aria-label="数値入力テンキー"
    >
      <div className={styles.grid}>
        {DIGIT_ROWS.map((row) => (
          <div className={styles.row} key={row.join('')}>
            {row.map((digit) => (
              <button
                key={digit}
                type="button"
                className={styles.key}
                onMouseDown={preventBlur}
                onClick={() => onDigit(digit)}
              >
                {digit}
              </button>
            ))}
          </div>
        ))}

        <div className={styles.row}>
          <button
            type="button"
            className={`${styles.key} ${styles.keySub}`}
            onMouseDown={preventBlur}
            onClick={onDecimal}
            disabled={decimalDisabled}
            aria-label="小数点"
          >
            .
          </button>
          <button
            type="button"
            className={styles.key}
            onMouseDown={preventBlur}
            onClick={() => onDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className={`${styles.key} ${styles.keySub}`}
            onMouseDown={preventBlur}
            onClick={onBackspace}
            aria-label="1文字削除"
          >
            ⌫
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles.advanceKey}
        onMouseDown={preventBlur}
        onClick={onAdvance}
        disabled={advanceDisabled}
      >
        {advanceLabel}
      </button>
    </div>
  )
}

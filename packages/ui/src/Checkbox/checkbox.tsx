'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import styles from './checkbox.module.css'

/**
 * Checkboxコンポーネントのプロパティ
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  /**
   * エラー状態
   * @default false
   */
  error?: boolean
  /**
   * ヘルパーテキスト（チェックボックスの下に表示される説明文）
   */
  helperText?: string
  /**
   * チェックボックスのラベル
   */
  label?: string
}

/**
 * Checkboxコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用したチェックボックスコンポーネント。
 * エラー状態、ヘルパーテキスト、ラベルをサポート。
 *
 * @example
 * ```tsx
 * <Checkbox
 *   id="terms"
 *   checked={accepted}
 *   onChange={(e) => setAccepted(e.target.checked)}
 *   label="利用規約に同意する"
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ error = false, helperText, label, className, ...props }, ref) => {
    const inputClasses = [styles.input, error && styles.error, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.container}>
        <label className={styles.label}>
          <input
            ref={ref}
            type="checkbox"
            className={inputClasses}
            aria-invalid={error}
            {...props}
          />
          {label && <span className={styles.labelText}>{label}</span>}
        </label>
        {helperText && (
          <p
            className={`${styles.helperText} ${error ? styles.helperError : ''}`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import styles from './select.module.css'

/**
 * 選択肢のインターフェース
 */
export interface SelectOption {
  /**
   * 選択肢の値
   */
  value: string
  /**
   * 選択肢の表示テキスト
   */
  label: string
  /**
   * 無効化フラグ
   */
  disabled?: boolean
}

/**
 * Selectコンポーネントのプロパティ
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * 選択肢のリスト
   */
  options: SelectOption[]
  /**
   * エラー状態
   * @default false
   */
  error?: boolean
  /**
   * ヘルパーテキスト（セレクトボックスの下に表示される説明文）
   */
  helperText?: string
  /**
   * プレースホルダー（未選択時の表示）
   */
  placeholder?: string
}

/**
 * Selectコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用したセレクトボックスコンポーネント。
 * エラー状態、ヘルパーテキスト、プレースホルダーをサポート。
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: 'option1', label: 'オプション1' },
 *     { value: 'option2', label: 'オプション2' },
 *   ]}
 *   placeholder="選択してください"
 *   error={!!selectError}
 *   helperText="いずれかを選択してください"
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      error = false,
      helperText,
      placeholder,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectClasses = [styles.select, error && styles.error, className]
      .filter(Boolean)
      .join(' ')

    const helperTextId = helperText && id ? `${id}-helper-text` : undefined

    return (
      <div className={styles.container}>
        <select
          ref={ref}
          id={id}
          className={selectClasses}
          aria-invalid={error}
          aria-describedby={helperTextId}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p
            id={helperTextId}
            className={`${styles.helperText} ${error ? styles.helperError : ''}`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

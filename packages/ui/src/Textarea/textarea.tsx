'use client'

import { type TextareaHTMLAttributes, forwardRef } from 'react'
import styles from './textarea.module.css'

/**
 * Textareaコンポーネントのプロパティ
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * エラー状態
   * @default false
   */
  error?: boolean
  /**
   * ヘルパーテキスト（入力欄の下に表示される説明文）
   */
  helperText?: string
}

/**
 * Textareaコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用した複数行入力フィールドコンポーネント。
 * エラー状態、ヘルパーテキストをサポート。
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="メモを入力してください"
 *   rows={3}
 *   error={!!memoError}
 *   helperText="最大500文字"
 *   maxLength={500}
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, helperText, className, ...props }, ref) => {
    const textareaClasses = [styles.textarea, error && styles.error, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.container}>
        <textarea
          ref={ref}
          className={textareaClasses}
          aria-invalid={error}
          {...props}
        />
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

Textarea.displayName = 'Textarea'

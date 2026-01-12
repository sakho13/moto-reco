'use client'

import { type LabelHTMLAttributes, forwardRef } from 'react'
import styles from './label.module.css'

/**
 * Labelコンポーネントのプロパティ
 */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * 必須フィールドかどうか（*マークを表示）
   * @default false
   */
  required?: boolean
}

/**
 * Labelコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用したラベルコンポーネント。
 * 必須フィールドの表示をサポート。
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>
 *   メールアドレス
 * </Label>
 * <Input id="email" type="email" />
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, className, children, ...props }, ref) => {
    const labelClasses = [styles.label, className].filter(Boolean).join(' ')

    return (
      <label ref={ref} className={labelClasses} {...props}>
        {children}
        {required && (
          <span className={styles.required} aria-label="必須">
            *
          </span>
        )}
      </label>
    )
  }
)

Label.displayName = 'Label'

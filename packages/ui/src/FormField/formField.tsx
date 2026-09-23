'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { Label } from '../label'
import styles from './formField.module.css'

/**
 * FormFieldコンポーネントのプロパティ
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * ラベルテキスト
   */
  label?: string
  /**
   * htmlForの値（inputのidと紐づける）
   */
  htmlFor?: string
  /**
   * 必須フィールドかどうか
   * @default false
   */
  required?: boolean
  /**
   * エラーメッセージ
   */
  error?: string
  /**
   * ヘルパーテキスト（入力欄の下に表示される説明文）
   */
  helperText?: string
  /**
   * 子要素（通常はInputコンポーネント）
   */
  children: React.ReactNode
}

/**
 * FormFieldコンポーネント
 *
 * @remarks
 * Label と入力コントロールを束ねるフォームフィールドコンテナ。
 * フィールド単位のエラーは罫線（入力欄側）と1行のテキストで示す。
 *
 * @example
 * ```tsx
 * <FormField
 *   label="メールアドレス"
 *   htmlFor="email"
 *   required
 *   error={emailError}
 *   helperText="有効なメールアドレスを入力してください"
 * >
 *   <Input
 *     id="email"
 *     type="email"
 *     error={!!emailError}
 *   />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      htmlFor,
      required = false,
      error,
      helperText,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const fieldClasses = [styles.formField, className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={fieldClasses} {...props}>
        {label && (
          <Label htmlFor={htmlFor} required={required}>
            {label}
          </Label>
        )}
        {children}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className={styles.helperText}>{helperText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

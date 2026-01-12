'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import styles from './errorMessage.module.css'

/**
 * ErrorMessageコンポーネントのプロパティ
 */
export interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * エラーメッセージの内容
   */
  children: React.ReactNode
}

/**
 * ErrorMessageコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用したエラーメッセージコンポーネント。
 * フォームのバリデーションエラーやその他のエラーメッセージを表示するために使用。
 *
 * @example
 * ```tsx
 * {emailError && (
 *   <ErrorMessage>
 *     {emailError}
 *   </ErrorMessage>
 * )}
 * ```
 */
export const ErrorMessage = forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ className, children, ...props }, ref) => {
    const errorClasses = [styles.errorMessage, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={errorClasses} role="alert" {...props}>
        {children}
      </div>
    )
  }
)

ErrorMessage.displayName = 'ErrorMessage'

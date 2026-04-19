'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import styles from './button.module.css'

/**
 * Buttonコンポーネントのプロパティ
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ボタンのバリアント
   * @default 'primary'
   */
  variant?: 'primary' | 'danger' | 'social' | 'cloud'
  /**
   * ボタンのサイズ
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'icon'
  /**
   * ローディング状態
   * @default false
   */
  loading?: boolean
  /**
   * フル幅表示
   * @default false
   */
  fullWidth?: boolean
}

/**
 * Buttonコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用したボタンコンポーネント。
 * variant、size、loading状態、fullWidthオプションをサポート。
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   クリック
 * </Button>
 *
 * <Button variant="danger" loading>
 *   処理中...
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg
              className={styles.spinnerSvg}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className={styles.spinnerCircle}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        <span className={loading ? styles.hiddenText : undefined}>
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

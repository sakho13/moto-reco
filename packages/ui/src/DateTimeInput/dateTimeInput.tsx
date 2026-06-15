'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { Input, type InputProps } from '../Input/input'

export interface DateTimeInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'step'
> {
  /**
   * 時間の刻み幅（分単位）。ブラウザのUI上で選択できる時間の間隔に影響する。
   * @default 1
   */
  minuteStep?: number
  error?: InputProps['error']
  helperText?: InputProps['helperText']
}

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ minuteStep = 1, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="datetime-local"
        step={minuteStep * 60}
        {...props}
      />
    )
  }
)

DateTimeInput.displayName = 'DateTimeInput'

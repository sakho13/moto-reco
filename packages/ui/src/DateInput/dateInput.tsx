'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { Input, type InputProps } from '../Input/input'

export interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  error?: InputProps['error']
  helperText?: InputProps['helperText']
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return <Input ref={ref} type="date" {...props} />
  }
)

DateInput.displayName = 'DateInput'

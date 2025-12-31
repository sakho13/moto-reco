'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import styles from './InfoBox.module.css'

export interface InfoBoxProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'error'
  children: React.ReactNode
}

export const InfoBox = forwardRef<HTMLDivElement, InfoBoxProps>(
  ({ variant = 'info', className, children, ...props }, ref) => {
    const classes = [styles.infoBox, styles[variant], className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

InfoBox.displayName = 'InfoBox'

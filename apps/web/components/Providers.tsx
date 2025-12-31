'use client'

import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { ThemeProvider } from '@repo/ui/context/ThemeContext'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          errorRetryCount: 3,
        }}
      >
        <ThemeProvider initialThemeName="default">{children}</ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  )
}

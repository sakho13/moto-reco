'use client'

import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { ThemeProvider } from '@packages/ui'
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
        <ThemeProvider>{children}</ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  )
}

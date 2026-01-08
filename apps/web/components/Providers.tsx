'use client'

import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { ThemeProvider } from '@repo/ui/context/ThemeContext'
import { Toaster } from '@repo/ui/sonner'
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
        <ThemeProvider initialThemeName="default">
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  )
}

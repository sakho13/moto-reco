'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const AdminShellNoSSR = dynamic(
  () => import('./AdminShell').then((m) => ({ default: m.AdminShell })),
  { ssr: false, loading: () => null }
)

export function DynamicAdminShell({ children }: { children: ReactNode }) {
  return <AdminShellNoSSR>{children}</AdminShellNoSSR>
}

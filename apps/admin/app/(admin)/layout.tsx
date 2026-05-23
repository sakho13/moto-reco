import { AdminShell } from '@/components/AdminShell'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}

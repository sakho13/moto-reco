import { DynamicAdminShell } from '@/components/DynamicAdminShell'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DynamicAdminShell>{children}</DynamicAdminShell>
}

import dynamic from 'next/dynamic'

// ThemedLayout内のTooltipがSSR/ハイドレーションでaria-describedby IDが不一致になるためSSR無効
const AdminShell = dynamic(
  () => import('@/components/AdminShell').then((m) => ({ default: m.AdminShell })),
  { ssr: false },
)

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}

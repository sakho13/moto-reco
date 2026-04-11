import type { Metadata } from 'next'
import { AdminLoginCard } from '@/components/AdminLoginCard'
import { APP_NAME } from '@/lib/statics'

export const metadata: Metadata = {
  title: `ログイン | ${APP_NAME}`,
}

export default function LoginPage() {
  return <AdminLoginCard />
}

import type { Metadata } from 'next'
import { createScreenTitle } from '@/lib/screenTitle'

export const metadata: Metadata = {
  title: createScreenTitle('フォト'),
}

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return children
}

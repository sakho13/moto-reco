'use client'

import { RefineThemes } from '@refinedev/antd'
import { App as AntdApp, ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import dynamic from 'next/dynamic'

// Refine の useLogin 等がプリレンダリング中にルーターコンテキスト不足で失敗するため SSR 無効
const LoginContent = dynamic(
  () =>
    import('@/components/LoginContent').then((m) => ({
      default: m.LoginContent,
    })),
  { ssr: false, loading: () => null }
)

export default function LoginPage() {
  return (
    <ConfigProvider
      theme={RefineThemes.Blue}
      locale={jaJP}
      warning={{ strict: false }}
    >
      <AntdApp>
        <LoginContent />
      </AntdApp>
    </ConfigProvider>
  )
}

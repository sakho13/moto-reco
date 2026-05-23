'use client'

import { AuthPage } from '@refinedev/antd'
import { Refine } from '@refinedev/core'
import { useNotificationProvider, RefineThemes } from '@refinedev/antd'
import routerProvider from '@refinedev/nextjs-router'
import { App as AntdApp, ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import '@refinedev/antd/dist/reset.css'

import { authProvider } from '@/providers/auth-provider'
import { dataProvider } from '@/providers/data-provider'

function LoginContent() {
  const notificationProvider = useNotificationProvider()

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={[]}
      options={{ syncWithLocation: false }}
    >
      <AuthPage
        type="login"
        title="Motoreco 管理画面"
        formProps={{ initialValues: {} }}
      />
    </Refine>
  )
}

export default function LoginPage() {
  return (
    <ConfigProvider theme={RefineThemes.Blue} locale={jaJP} warning={{ strict: false }}>
      <AntdApp>
        <LoginContent />
      </AntdApp>
    </ConfigProvider>
  )
}

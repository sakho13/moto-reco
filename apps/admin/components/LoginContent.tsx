'use client'

import { AuthPage, useNotificationProvider } from '@refinedev/antd'
import { Refine } from '@refinedev/core'
import routerProvider from '@refinedev/nextjs-router'
import { authProvider } from '@/providers/auth-provider'
import { dataProvider } from '@/providers/data-provider'

export function LoginContent() {
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

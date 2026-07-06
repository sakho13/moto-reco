'use client'

import {
  useNotificationProvider,
  ThemedLayout,
  RefineThemes,
} from '@refinedev/antd'
import { Refine } from '@refinedev/core'
import routerProvider from '@refinedev/nextjs-router'
import { App as AntdApp, ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import { authProvider } from '@/providers/auth-provider'
import { dataProvider } from '@/providers/data-provider'

const resources = [
  {
    name: 'users',
    list: '/users',
    show: '/users/:id',
    edit: '/users/:id/edit',
    meta: { label: 'ユーザー' },
  },
  {
    name: 'bikes',
    list: '/bikes',
    create: '/bikes/create',
    edit: '/bikes/:id/edit',
    show: '/bikes/:id',
    meta: { label: 'バイク' },
  },
  {
    name: 'manufacturers',
    list: '/manufacturers',
    create: '/manufacturers/create',
    edit: '/manufacturers/:id/edit',
    show: '/manufacturers/:id',
    meta: { label: 'メーカー' },
  },
  {
    name: 'goods-manufacturers',
    list: '/goods-manufacturers',
    create: '/goods-manufacturers/create',
    edit: '/goods-manufacturers/:id/edit',
    show: '/goods-manufacturers/:id',
    meta: { label: 'グッズメーカー' },
  },
  {
    name: 'goods-models',
    list: '/goods-models',
    create: '/goods-models/create',
    edit: '/goods-models/:id/edit',
    show: '/goods-models/:id',
    meta: { label: 'グッズ型番' },
  },
  {
    name: 'my-bikes',
    show: '/my-bikes/:id',
    meta: { hide: true },
  },
  {
    name: 'announcements',
    list: '/announcements',
    create: '/announcements/create',
    show: '/announcements/:id',
    meta: { label: 'アナウンス' },
  },
  {
    name: 'notifications',
    list: '/notifications',
    show: '/notifications/:id',
    meta: { label: 'ユーザー通知' },
  },
]

function AdminLayout({ children }: { children: React.ReactNode }) {
  const notificationProvider = useNotificationProvider()

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProvider}
      notificationProvider={notificationProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        title: {
          text: 'MotoReco',
        },
      }}
    >
      <ThemedLayout>{children}</ThemedLayout>
    </Refine>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={RefineThemes.Blue}
      locale={jaJP}
      warning={{ strict: false }}
    >
      <AntdApp>
        <AdminLayout>{children}</AdminLayout>
      </AntdApp>
    </ConfigProvider>
  )
}

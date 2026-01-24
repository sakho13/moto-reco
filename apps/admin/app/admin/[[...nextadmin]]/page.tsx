import { PageProps, PrismaClient } from '@premieroctet/next-admin'
import { getNextAdminProps } from '@premieroctet/next-admin/appRouter'
import { NextAdmin } from '@premieroctet/next-admin/adapters/next'
import { prisma } from '@repo/database'

export default async function AdminPage({ params, searchParams }: PageProps) {
  const awaitedParams = await params
  const awaitedSearchParams = await searchParams

  const props = await getNextAdminProps({
    params: awaitedParams.nextadmin,
    searchParams: awaitedSearchParams,
    basePath: '/admin',
    apiBasePath: '/api/admin',
    prisma: prisma as PrismaClient,
    options: {
      title: '管理画面',

      sidebar: {
        groups: [
          {
            title: 'Users',
            models: ['MUser', 'MAuthProvider', 'TUserQuit'],
          },
        ],
      },
    },
  })

  return <NextAdmin {...props} />
}

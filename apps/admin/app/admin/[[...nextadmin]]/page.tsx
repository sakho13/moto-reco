import { NextAdmin, PageProps } from '@premieroctet/next-admin'
import { getNextAdminProps } from '@premieroctet/next-admin/appRouter'
import { prisma } from '@/lib/prisma'
import { options } from '@/lib/options'
import schema from '@packages/database/json-schema'
import '@premieroctet/next-admin/dist/styles.css'

export default async function AdminPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const props = await getNextAdminProps({
    params: resolvedParams.nextadmin,
    searchParams: resolvedSearchParams,
    basePath: '/admin',
    apiBasePath: '/api/admin',
    prisma,
    schema,
    options,
  })

  return <NextAdmin {...props} />
}

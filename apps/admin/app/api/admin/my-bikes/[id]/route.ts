import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const myBike = await prisma.tUserMyBike.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      userBike: {
        include: {
          bike: {
            include: { manufacturer: { select: { id: true, name: true } } },
          },
        },
      },
      fuelLogs: {
        orderBy: { refueledAt: 'desc' },
      },
      maintenanceLogs: {
        include: { maintenanceItems: true },
        orderBy: { performedAt: 'desc' },
      },
      tourings: {
        orderBy: { startDate: 'desc' },
      },
    },
  })

  if (!myBike)
    return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(myBike)
}

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { getCurrentDate } from '@repo/shared-utils'
import { PrismaPurgeTargetRepository } from '@/lib/api/server/repositories/PrismaPurgeTargetRepository'
import { PrismaPurgeUserRepository } from '@/lib/api/server/repositories/PrismaPurgeUserRepository'
import { PurgeUserService } from '@/lib/api/server/services/PurgeUserService'
import { requireSystemApiKey } from '@/lib/api/systemApiKeyAuth'

/**
 * 猶予期間（30日）を超過した退会ユーザーを完全物理削除する内部API
 *
 * @remarks
 * GitHub Actionsの週次スケジュール（`.github/workflows/purge-quit-users.yml`）から
 * 呼び出される想定。`MSystemApiKey` によるハッシュ照合で保護する。
 */
export async function POST(request: NextRequest) {
  const auth = await requireSystemApiKey(request)
  if ('error' in auth) return auth.error

  const service = new PurgeUserService(
    new PrismaPurgeTargetRepository(prisma),
    new PrismaPurgeUserRepository(prisma)
  )

  const result = await service.purgeExpiredQuitUsers(getCurrentDate())

  return NextResponse.json({
    ...result,
    message: `完全削除バッチが完了しました（成功: ${result.succeededUserIds.length}件 / 失敗: ${result.failedUserIds.length}件）`,
  })
}

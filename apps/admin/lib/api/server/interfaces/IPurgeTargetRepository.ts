import type { UserId } from '@repo/shared-types'

export type PurgeTargetUser = {
  userId: UserId
}

export interface IPurgeTargetRepository {
  /**
   * 完全削除バッチ対象（status=QUIT かつ purgeAt <= now）のユーザーIDを取得する
   */
  findPurgeTargets(now: Date): Promise<PurgeTargetUser[]>
}

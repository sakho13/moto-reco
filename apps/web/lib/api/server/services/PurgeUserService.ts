import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'
import type { UserId } from '@repo/shared-types'
import {
  getFirebaseAdminStorage,
  getStorageBucketName,
} from '../../../firebase/adminStorage'
import { IPurgeUserRepository } from '../interfaces/IPurgeUserRepository'
import { IUserQuitRepository } from '../interfaces/IUserQuitRepository'

export type PurgeUserResult = {
  succeededUserIds: string[]
  failedUserIds: string[]
}

/**
 * 猶予期間（30日）を超過した退会ユーザーを完全物理削除するサービス
 *
 * @remarks
 * 対象ユーザーごとに (1) Storage実ファイル削除 → (2) Restrict FK対応の明示削除
 * → (3) DB本体削除（Cascadeで関連データも削除） → (4) Firebase Authアカウント削除
 * の順で処理する。1ユーザーの失敗がバッチ全体を止めないよう、ユーザー単位で
 * try/catchする。
 */
export class PurgeUserService {
  constructor(
    private readonly _userQuitRepository: IUserQuitRepository,
    private readonly _purgeUserRepository: IPurgeUserRepository
  ) {}

  async purgeExpiredQuitUsers(now: Date): Promise<PurgeUserResult> {
    const targets = await this._userQuitRepository.findPurgeTargets(now)

    const succeededUserIds: string[] = []
    const failedUserIds: string[] = []

    for (const target of targets) {
      try {
        await this.purgeUser(target.userId)
        succeededUserIds.push(target.userId)
      } catch (error) {
        console.error(
          `[PurgeUserService] ユーザー ${target.userId} の完全削除に失敗しました`,
          error
        )
        failedUserIds.push(target.userId)
      }
    }

    return { succeededUserIds, failedUserIds }
  }

  private async purgeUser(userId: UserId): Promise<void> {
    const [storagePaths, authProviders] = await Promise.all([
      this._purgeUserRepository.findPhotoStoragePathsByUserId(userId),
      this._purgeUserRepository.findAuthProvidersByUserId(userId),
    ])

    // 1. Storage実ファイル削除（個別失敗はDB削除を妨げない）
    if (storagePaths.length > 0) {
      const bucket = getFirebaseAdminStorage().bucket(getStorageBucketName())
      for (const storagePath of storagePaths) {
        try {
          await bucket.file(storagePath).delete({ ignoreNotFound: true })
        } catch (error) {
          console.error(
            `[PurgeUserService] Storageファイル削除に失敗しました: ${storagePath}`,
            error
          )
        }
      }
    }

    // 2. Restrict FK対応: 自身がchangedByとなっているプラン変更履歴を明示削除
    await this._purgeUserRepository.deletePlanHistoryAsChangedBy(userId)

    // 3. DB本体削除（Cascadeで残りの関連データも削除される）
    await this._purgeUserRepository.deleteUser(userId)

    // 4. Firebase Authアカウント削除（個別失敗は他プロバイダの削除を妨げない）
    const authClient = getFirebaseAdminAuthClient()
    for (const provider of authProviders) {
      try {
        await authClient.deleteUser(provider.externalId)
      } catch (error) {
        console.error(
          `[PurgeUserService] Firebase Authアカウント削除に失敗しました: ${provider.externalId}`,
          error
        )
      }
    }
  }
}

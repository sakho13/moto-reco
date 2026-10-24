import {
  getFirebaseAdminAuthClient,
  getFirebaseAdminStorage,
  getStorageBucketName,
} from '@repo/firebase-auth-server'
import type { UserId } from '@repo/shared-types'
import { IPurgeTargetRepository } from '../interfaces/IPurgeTargetRepository'
import { IPurgeUserRepository } from '../interfaces/IPurgeUserRepository'

export type PurgeUserResult = {
  succeededUserIds: string[]
  failedUserIds: string[]
}

/**
 * 猶予期間（30日）を超過した退会ユーザーを完全物理削除するサービス
 *
 * @remarks
 * 対象ユーザーごとに (1) Firebase Authアカウント削除 → (2) Storage実ファイル削除
 * → (3) Restrict FK対応の明示削除 → (4) DB本体削除（Cascadeで関連データも削除）
 * の順で処理する。Firebase Authの削除に失敗した場合はDB削除まで進めず、
 * ユーザー単位で失敗として扱う（DBレコードを残すことで次回バッチでも再試行できるようにする）。
 * 1ユーザーの失敗がバッチ全体を止めないよう、ユーザー単位でtry/catchする。
 */
export class PurgeUserService {
  constructor(
    private readonly _purgeTargetRepository: IPurgeTargetRepository,
    private readonly _purgeUserRepository: IPurgeUserRepository
  ) {}

  async purgeExpiredQuitUsers(now: Date): Promise<PurgeUserResult> {
    const targets = await this._purgeTargetRepository.findPurgeTargets(now)

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

    // 1. Firebase Authアカウント削除
    //
    // DB削除（Cascade）より先に行う。ここで例外を投げるとDB削除まで進まないため、
    // 対象ユーザーのTUserQuitレコードが残り、次回バッチでも再試行対象になる。
    // 既に削除済み（auth/user-not-found）の場合のみ成功扱いとしてスキップする。
    const authClient = getFirebaseAdminAuthClient()
    for (const provider of authProviders) {
      try {
        await authClient.deleteUser(provider.externalId)
      } catch (error) {
        if (!isUserNotFoundError(error)) {
          throw error
        }
      }
    }

    // 2. Storage実ファイル削除（個別失敗はDB削除を妨げない）
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

    // 3. Restrict FK対応: 自身がchangedByとなっているプラン変更履歴を明示削除
    await this._purgeUserRepository.deletePlanHistoryAsChangedBy(userId)

    // 4. DB本体削除（Cascadeで残りの関連データも削除される）
    await this._purgeUserRepository.deleteUser(userId)
  }
}

function isUserNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  )
}

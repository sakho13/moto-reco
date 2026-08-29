import { createHash, randomBytes } from 'crypto'
import {
  UserQuitEntity,
  ApiV1Error,
  IUserQuitRepository,
  IUserRepository,
} from '@repo/shared-domain'
import { createUserQuitId, type UserId } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'

/** 退会から完全物理削除までの猶予期間（日数） */
const PURGE_GRACE_PERIOD_DAYS = 30

type QuitUserParams = {
  userId: UserId
  quitReason: string
}

type RecoverUserParams = {
  /** メールに埋め込まれた平文の復帰トークン */
  token: string
}

export class UserQuitService {
  constructor(
    private userRepository: IUserRepository,
    private authProviderRepository: PrismaAuthProviderRepository,
    private userQuitRepository: IUserQuitRepository
  ) {}

  /**
   * ユーザーを退会（論理削除）させる
   *
   * @remarks
   * GUEST/ADMINロールは退会不可（GUESTは既存の自動失効に委ね、ADMINは
   * 自己退会するとTUserPlanHistory.changedByのRestrict制約で完全削除バッチが
   * 破綻するため運用上禁止する）。
   * 復帰用トークンは平文のまま返却し、呼び出し元（ルートハンドラ）でメール送信に使う。
   * 平文自体はDBに保存せず、SHA-256ハッシュのみ保存する。
   */
  public async quitUser(params: QuitUserParams): Promise<{
    recoveryToken: string
  }> {
    const user = await this.userRepository.findById(params.userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    if (user.role === 'GUEST' || user.role === 'ADMIN') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'このアカウントは退会機能をご利用いただけません'
      )
    }

    const recoveryToken = randomBytes(32).toString('base64url')
    const recoveryTokenHash = createHash('sha256')
      .update(recoveryToken)
      .digest('hex')

    const quitAt = getCurrentDate()
    const purgeAt = new Date(
      quitAt.getTime() + PURGE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    )

    await this.userQuitRepository.create(
      new UserQuitEntity({
        id: createUserQuitId(''),
        userId: params.userId,
        quitReason: params.quitReason,
        quitAt,
        recoveryTokenHash,
        purgeAt,
        status: 'QUIT',
      })
    )

    await this.userRepository.deactivateUser(params.userId)
    await this.authProviderRepository.deactivateByUserId(params.userId)

    return { recoveryToken }
  }

  /**
   * 復帰用トークンでユーザーを復帰（有効化）させる
   *
   * @remarks
   * Firebase認証は不要。トークンのみで完結する公開エンドポイントから呼ばれる。
   * ワンタイム利用（RECOVEREDにした時点で再利用不可）。
   */
  public async recoverUser(params: RecoverUserParams): Promise<{
    userId: UserId
  }> {
    const recoveryTokenHash = createHash('sha256')
      .update(params.token)
      .digest('hex')

    const userQuit =
      await this.userQuitRepository.findByRecoveryTokenHash(recoveryTokenHash)

    if (!userQuit) {
      throw new ApiV1Error('NOT_FOUND', '復帰トークンが無効です')
    }

    if (userQuit.status === 'RECOVERED') {
      throw new ApiV1Error('INVALID_REQUEST', '既に復帰済みです')
    }

    if (userQuit.purgeAt.getTime() <= getCurrentDate().getTime()) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '復帰可能期間を過ぎているため復帰できません'
      )
    }

    const userId = userQuit.userId
    const user = await this.userRepository.findByIdIncludingInactive(userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    if (user.status !== 'INACTIVE') {
      throw new ApiV1Error('INVALID_REQUEST', '復帰できない状態です')
    }

    await this.userRepository.activateUser(userId)
    await this.authProviderRepository.activateByUserId(userId)
    await this.userQuitRepository.updateStatus(userId, 'RECOVERED')

    return { userId }
  }
}

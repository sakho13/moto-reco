import { UserId } from './user'

export type UserQuitId = string & { readonly brand: unique symbol }
export const createUserQuitId = (id: string): UserQuitId => id as UserQuitId

export type UserQuitStatus = 'QUIT' | 'RECOVERED'

export type UserQuit = {
  id: UserQuitId
  userId: UserId
  quitReason: string
  quitAt: Date
  /** 復帰トークンのSHA-256ハッシュ（平文トークンはメールにのみ埋め込みDBには保存しない） */
  recoveryTokenHash: string
  /** 完全物理削除予定日時（quitAtの30日後） */
  purgeAt: Date
  status: UserQuitStatus
}

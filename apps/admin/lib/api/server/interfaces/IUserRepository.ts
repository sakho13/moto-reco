import { UserId } from '@repo/shared-types'
import { UserEntity } from '../entities/UserEntity'

export interface IUserRepository {
  /** 内部User IDからUserを取得 */
  findById(userId: UserId): Promise<UserEntity | null>
}

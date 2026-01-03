import { UserQuitEntity } from '../entities/UserQuitEntity'

export interface IUserQuitRepository {
  /**
   * 退会情報を登録する
   */
  create(userQuit: UserQuitEntity): Promise<UserQuitEntity>
}

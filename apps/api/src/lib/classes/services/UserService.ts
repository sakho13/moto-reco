import { IUserRepository } from '../../interfaces/IUserRepository'

export class UserService {
  private _userRepository: IUserRepository

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository
  }
}

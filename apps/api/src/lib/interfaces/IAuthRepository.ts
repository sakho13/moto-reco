import { AuthProviderEntity } from '../classes/entities/AuthProviderEntity'

export interface IAuthRepository {
  authorize(token: string): Promise<AuthProviderEntity | null>
}

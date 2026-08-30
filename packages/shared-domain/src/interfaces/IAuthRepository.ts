import { AuthProviderEntity } from '../entities/AuthProviderEntity'

export interface IAuthRepository {
  authorize(token: string): Promise<AuthProviderEntity | null>
}

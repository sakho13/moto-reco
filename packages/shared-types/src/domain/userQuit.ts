import { UserId } from './user'

export type UserQuitId = string & { readonly brand: unique symbol }
export const createUserQuitId = (id: string): UserQuitId => id as UserQuitId

export type UserQuitStatus = 'QUIT' | 'RECOVERED'

export type UserQuit = {
  id: UserQuitId
  userId: UserId
  quitReason: string
  quitAt: Date
  recoveryCode: string
  status: UserQuitStatus
}

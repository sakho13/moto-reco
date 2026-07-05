export type UserId = string & { readonly brand: unique symbol }
export const createUserId = (id: string): UserId => id as UserId

/** 料金プラン。role === 'USER' のユーザーにのみ適用される */
export type UserPlan = 'FREE' | 'PREMIUM'

export type User = {
  id: UserId
  name: string
  role: 'USER' | 'ADMIN' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  notificationEmail: string | null
  isProfilePublic: boolean
}

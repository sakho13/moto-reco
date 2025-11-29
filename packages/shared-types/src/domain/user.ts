export type UserId = string & { readonly brand: unique symbol }
export const createUserId = (id: string): UserId => id as UserId

export type User = {
  id: UserId
  name: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

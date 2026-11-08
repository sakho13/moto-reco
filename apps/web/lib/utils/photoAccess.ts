import type { UserRole } from '@repo/shared-types'

/** 写真の閲覧・追加・削除ができるユーザーか。現状は ADMIN のみ */
export const canUsePhotos = (role: UserRole | undefined): boolean =>
  role === 'ADMIN'

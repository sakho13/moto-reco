import { MyUserBikeId } from './bike'
import { SpotId } from './spot'
import { TouringId } from './touring'
import { UserId } from './user'

export type PhotoId = string & { readonly __brand: unique symbol }
export const createPhotoId = (id: string): PhotoId => id as PhotoId

/** 写真がどのエンティティに紐づいているか。1枚の写真が複数の紐づけを持つ場合もある */
export type PhotoAttachment =
  | { type: 'TOURING'; touringId: TouringId }
  | { type: 'SPOT'; spotId: SpotId }
  | { type: 'BIKE'; myUserBikeId: MyUserBikeId }

export type Photo = {
  photoId: PhotoId
  userId: UserId
  photoUrl: string
  storagePath: string
  memo: string | null
  takenAt: Date
  attachments: PhotoAttachment[]
}

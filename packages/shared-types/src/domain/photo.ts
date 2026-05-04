import { SpotId } from './spot'
import { TouringId } from './touring'
import { UserId } from './user'

export type PhotoId = string & { readonly __brand: unique symbol }
export const createPhotoId = (id: string): PhotoId => id as PhotoId

export type TouringPhotoId = string & { readonly __brand: unique symbol }
export const createTouringPhotoId = (id: string): TouringPhotoId =>
  id as TouringPhotoId

export type SpotPhotoId = string & { readonly __brand: unique symbol }
export const createSpotPhotoId = (id: string): SpotPhotoId => id as SpotPhotoId

export type Photo = {
  photoId: PhotoId
  userId: UserId
  photoUrl: string
  storagePath: string
  memo: string | null
  takenAt: Date
}

export type TouringPhoto = Photo & {
  touringPhotoId: TouringPhotoId
  touringId: TouringId
  orderIndex: number
}

export type SpotPhoto = Photo & {
  spotPhotoId: SpotPhotoId
  spotId: SpotId
  orderIndex: number
}

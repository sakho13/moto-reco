import { PhotoId, SpotId, TouringId, UserId } from '@repo/shared-types'
import {
  PhotoEntity,
  SpotPhotoEntity,
  TouringPhotoEntity,
} from '../entities/PhotoEntity'

type CreatePhotoForTouringParams = {
  userId: UserId
  touringId: TouringId
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
  orderIndex: number
}

type CreatePhotoForSpotParams = {
  userId: UserId
  spotId: SpotId
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
  orderIndex: number
}

export interface IPhotoRepository {
  createPhotoForTouring(
    params: CreatePhotoForTouringParams
  ): Promise<TouringPhotoEntity>
  createPhotoForSpot(params: CreatePhotoForSpotParams): Promise<SpotPhotoEntity>
  findPhotosByTouringId(touringId: TouringId): Promise<TouringPhotoEntity[]>
  findPhotosBySpotId(spotId: SpotId): Promise<SpotPhotoEntity[]>
  findPhotoById(photoId: PhotoId): Promise<PhotoEntity | null>
  deletePhoto(photoId: PhotoId): Promise<string>
}

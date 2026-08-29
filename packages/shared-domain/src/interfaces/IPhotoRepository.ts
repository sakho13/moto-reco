import {
  MyUserBikeId,
  PhotoId,
  SpotId,
  TouringId,
  UserId,
} from '@repo/shared-types'
import { PhotoEntity } from '../entities/PhotoEntity'

type CreatePhotoForTouringParams = {
  userId: UserId
  touringId: TouringId
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
}

type CreatePhotoForSpotParams = {
  userId: UserId
  spotId: SpotId
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
}

type CreatePhotoForBikeParams = {
  userId: UserId
  myUserBikeId: MyUserBikeId
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
}

type FindPhotosByUserIdParams = {
  skip: number
  take: number
}

export interface IPhotoRepository {
  createPhotoForTouring(
    params: CreatePhotoForTouringParams
  ): Promise<PhotoEntity>
  createPhotoForSpot(params: CreatePhotoForSpotParams): Promise<PhotoEntity>
  createPhotoForBike(params: CreatePhotoForBikeParams): Promise<PhotoEntity>
  findPhotosByTouringId(touringId: TouringId): Promise<PhotoEntity[]>
  findPhotosBySpotId(spotId: SpotId): Promise<PhotoEntity[]>
  findPhotosByMyBikeId(myUserBikeId: MyUserBikeId): Promise<PhotoEntity[]>
  findPhotosByUserId(
    userId: UserId,
    params: FindPhotosByUserIdParams
  ): Promise<PhotoEntity[]>
  findPhotoById(photoId: PhotoId): Promise<PhotoEntity | null>
  deletePhoto(photoId: PhotoId): Promise<string>
}

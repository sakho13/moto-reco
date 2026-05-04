import { PhotoId, SpotId, TouringId, UserId } from '@repo/shared-types'
import { SpotPhotoEntity, TouringPhotoEntity } from '../entities/PhotoEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IPhotoRepository } from '../interfaces/IPhotoRepository'

type RegisterPhotosForTouringParams = {
  userId: UserId
  touringId: TouringId
  photos: {
    storagePath: string
    photoUrl: string
    memo?: string | null
    takenAt: Date
  }[]
}

type RegisterPhotosForSpotParams = {
  userId: UserId
  spotId: SpotId
  photos: {
    storagePath: string
    photoUrl: string
    memo?: string | null
    takenAt: Date
  }[]
}

type DeletePhotoParams = {
  photoId: PhotoId
  userId: UserId
}

export class PhotoService {
  constructor(private photoRepository: IPhotoRepository) {}

  public async registerPhotosForTouring(
    params: RegisterPhotosForTouringParams
  ): Promise<TouringPhotoEntity[]> {
    const existing = await this.photoRepository.findPhotosByTouringId(
      params.touringId
    )
    const baseOrderIndex = existing.length

    const created: TouringPhotoEntity[] = []
    for (let i = 0; i < params.photos.length; i++) {
      const p = params.photos[i]!
      const entity = await this.photoRepository.createPhotoForTouring({
        userId: params.userId,
        touringId: params.touringId,
        storagePath: p.storagePath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
        orderIndex: baseOrderIndex + i,
      })
      created.push(entity)
    }

    return created
  }

  public async registerPhotosForSpot(
    params: RegisterPhotosForSpotParams
  ): Promise<SpotPhotoEntity[]> {
    const existing = await this.photoRepository.findPhotosBySpotId(
      params.spotId
    )
    const baseOrderIndex = existing.length

    const created: SpotPhotoEntity[] = []
    for (let i = 0; i < params.photos.length; i++) {
      const p = params.photos[i]!
      const entity = await this.photoRepository.createPhotoForSpot({
        userId: params.userId,
        spotId: params.spotId,
        storagePath: p.storagePath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
        orderIndex: baseOrderIndex + i,
      })
      created.push(entity)
    }

    return created
  }

  public async getPhotosByTouringId(
    touringId: TouringId
  ): Promise<TouringPhotoEntity[]> {
    return this.photoRepository.findPhotosByTouringId(touringId)
  }

  public async getPhotosBySpotId(spotId: SpotId): Promise<SpotPhotoEntity[]> {
    return this.photoRepository.findPhotosBySpotId(spotId)
  }

  /** 写真を削除してStorage上のファイルパスを返す */
  public async deletePhoto(params: DeletePhotoParams): Promise<string> {
    const photo = await this.photoRepository.findPhotoById(params.photoId)

    if (!photo) {
      throw new ApiV1Error('NOT_FOUND', '指定された写真が見つかりません')
    }

    if (photo.userId !== params.userId) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'この写真を削除する権限がありません'
      )
    }

    return this.photoRepository.deletePhoto(params.photoId)
  }
}

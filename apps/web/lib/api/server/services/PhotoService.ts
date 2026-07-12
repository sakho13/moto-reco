import {
  MyUserBikeId,
  PhotoId,
  SpotId,
  TouringId,
  UserId,
} from '@repo/shared-types'
import { PhotoEntity } from '../entities/PhotoEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IPhotoRepository } from '../interfaces/IPhotoRepository'

type PhotoInput = {
  storagePath: string
  photoUrl: string
  memo?: string | null
  takenAt: Date
}

type RegisterPhotosForTouringParams = {
  userId: UserId
  touringId: TouringId
  photos: PhotoInput[]
}

type RegisterPhotosForSpotParams = {
  userId: UserId
  spotId: SpotId
  photos: PhotoInput[]
}

type RegisterPhotosForBikeParams = {
  userId: UserId
  myUserBikeId: MyUserBikeId
  photos: PhotoInput[]
}

type GetPhotosByUserIdParams = {
  page: number
  pageSize: number
}

type DeletePhotoParams = {
  photoId: PhotoId
  userId: UserId
}

export class PhotoService {
  constructor(private photoRepository: IPhotoRepository) {}

  public async registerPhotosForTouring(
    params: RegisterPhotosForTouringParams
  ): Promise<PhotoEntity[]> {
    const created: PhotoEntity[] = []
    for (const p of params.photos) {
      const entity = await this.photoRepository.createPhotoForTouring({
        userId: params.userId,
        touringId: params.touringId,
        storagePath: p.storagePath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })
      created.push(entity)
    }

    return created
  }

  public async registerPhotosForSpot(
    params: RegisterPhotosForSpotParams
  ): Promise<PhotoEntity[]> {
    const created: PhotoEntity[] = []
    for (const p of params.photos) {
      const entity = await this.photoRepository.createPhotoForSpot({
        userId: params.userId,
        spotId: params.spotId,
        storagePath: p.storagePath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })
      created.push(entity)
    }

    return created
  }

  public async registerPhotosForBike(
    params: RegisterPhotosForBikeParams
  ): Promise<PhotoEntity[]> {
    const created: PhotoEntity[] = []
    for (const p of params.photos) {
      const entity = await this.photoRepository.createPhotoForBike({
        userId: params.userId,
        myUserBikeId: params.myUserBikeId,
        storagePath: p.storagePath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })
      created.push(entity)
    }

    return created
  }

  public async getPhotosByTouringId(
    touringId: TouringId
  ): Promise<PhotoEntity[]> {
    return this.photoRepository.findPhotosByTouringId(touringId)
  }

  public async getPhotosBySpotId(spotId: SpotId): Promise<PhotoEntity[]> {
    return this.photoRepository.findPhotosBySpotId(spotId)
  }

  public async getPhotosByMyBikeId(
    myUserBikeId: MyUserBikeId
  ): Promise<PhotoEntity[]> {
    return this.photoRepository.findPhotosByMyBikeId(myUserBikeId)
  }

  /** ユーザーの全写真を横断して取得する（マイフォト・ギャラリー用） */
  public async getPhotosByUserId(
    userId: UserId,
    params: GetPhotosByUserIdParams
  ): Promise<PhotoEntity[]> {
    const skip = (params.page - 1) * params.pageSize
    return this.photoRepository.findPhotosByUserId(userId, {
      skip,
      take: params.pageSize,
    })
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

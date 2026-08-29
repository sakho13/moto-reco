import {
  PhotoEntity,
  TouringEntity,
  ApiV1Error,
  IMyUserBikeRepository,
  IPhotoRepository,
  ISpotRepository,
  ITouringRepository,
} from '@repo/shared-domain'
import {
  MyUserBikeId,
  PhotoId,
  SpotId,
  TouringId,
  UserId,
} from '@repo/shared-types'

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
  touringId: TouringId
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
  constructor(
    private photoRepository: IPhotoRepository,
    private touringRepository: ITouringRepository,
    private spotRepository: ISpotRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  /** ツーリングがユーザー本人の所有物であることを検証し、見つからなければ404を投げる */
  private async requireTouringOwnership(
    touringId: TouringId,
    userId: UserId
  ): Promise<TouringEntity> {
    const touring = await this.touringRepository.findTouringByIdForUser(
      touringId,
      userId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    return touring
  }

  /** スポットが指定ツーリング配下かつユーザー本人の所有物であることを検証し、見つからなければ404を投げる */
  private async requireSpotOwnership(
    spotId: SpotId,
    touringId: TouringId,
    userId: UserId
  ): Promise<void> {
    await this.requireTouringOwnership(touringId, userId)

    const spot = await this.spotRepository.findSpotById(spotId, touringId)
    if (!spot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }
  }

  /** バイクがユーザー本人の所有物であることを検証し、見つからなければ404を投げる */
  private async requireMyUserBikeOwnership(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )
    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }
  }

  public async registerPhotosForTouring(
    params: RegisterPhotosForTouringParams
  ): Promise<PhotoEntity[]> {
    await this.requireTouringOwnership(params.touringId, params.userId)

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
    await this.requireSpotOwnership(
      params.spotId,
      params.touringId,
      params.userId
    )

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
    await this.requireMyUserBikeOwnership(params.myUserBikeId, params.userId)

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
    touringId: TouringId,
    userId: UserId
  ): Promise<PhotoEntity[]> {
    await this.requireTouringOwnership(touringId, userId)
    return this.photoRepository.findPhotosByTouringId(touringId)
  }

  public async getPhotosBySpotId(
    spotId: SpotId,
    touringId: TouringId,
    userId: UserId
  ): Promise<PhotoEntity[]> {
    await this.requireSpotOwnership(spotId, touringId, userId)
    return this.photoRepository.findPhotosBySpotId(spotId)
  }

  public async getPhotosByMyBikeId(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<PhotoEntity[]> {
    await this.requireMyUserBikeOwnership(myUserBikeId, userId)
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

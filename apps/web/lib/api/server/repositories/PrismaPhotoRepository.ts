import {
  createMyUserBikeId,
  createPhotoId,
  createSpotId,
  createTouringId,
  createUserId,
  MyUserBikeId,
  PhotoAttachment,
  PhotoId,
  SpotId,
  TouringId,
  UserId,
} from '@repo/shared-types'
import { PhotoEntity } from '../entities/PhotoEntity'
import { IPhotoRepository } from '../interfaces/IPhotoRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

/**
 * 写真の紐づけ(ツーリング/スポット/バイク)を解決するための共通include。
 * 中間テーブルはいずれも(親キー, photoId)の複合主キーのみを持つため、
 * 親キーだけをselectすれば十分。
 */
const PHOTO_ATTACHMENTS_INCLUDE = {
  touringLinks: { select: { touringId: true } },
  spotLinks: { select: { spotId: true } },
  bikeLinks: { select: { userMyBikeId: true } },
} as const

type PhotoRow = {
  id: string
  userId: string
  photoUrl: string
  storagePath: string
  memo: string | null
  takenAt: Date
  touringLinks: { touringId: string }[]
  spotLinks: { spotId: string }[]
  bikeLinks: { userMyBikeId: string }[]
}

export class PrismaPhotoRepository
  extends PrismaRepositoryBase
  implements IPhotoRepository
{
  /** 写真の行データを PhotoEntity に変換する。中間テーブル同士の相互排他はDBのCHECK制約ではなく各create系メソッドの呼び分けで保証している前提 */
  private toEntity(row: PhotoRow): PhotoEntity {
    const attachments: PhotoAttachment[] = [
      ...row.touringLinks.map(
        (l): PhotoAttachment => ({
          type: 'TOURING',
          touringId: createTouringId(l.touringId),
        })
      ),
      ...row.spotLinks.map(
        (l): PhotoAttachment => ({
          type: 'SPOT',
          spotId: createSpotId(l.spotId),
        })
      ),
      ...row.bikeLinks.map(
        (l): PhotoAttachment => ({
          type: 'BIKE',
          myUserBikeId: createMyUserBikeId(l.userMyBikeId),
        })
      ),
    ]

    return new PhotoEntity({
      photoId: createPhotoId(row.id),
      userId: createUserId(row.userId),
      photoUrl: row.photoUrl,
      storagePath: row.storagePath,
      memo: row.memo,
      takenAt: row.takenAt,
      attachments,
    })
  }

  public async createPhotoForTouring(
    params: Parameters<IPhotoRepository['createPhotoForTouring']>[0]
  ): Promise<PhotoEntity> {
    const photo = await this.connection.tUserPhoto.create({
      data: {
        userId: params.userId,
        photoUrl: params.photoUrl,
        storagePath: params.storagePath,
        memo: params.memo ?? null,
        takenAt: params.takenAt,
        touringLinks: { create: { touringId: params.touringId } },
      },
      include: PHOTO_ATTACHMENTS_INCLUDE,
    })

    return this.toEntity(photo)
  }

  public async createPhotoForSpot(
    params: Parameters<IPhotoRepository['createPhotoForSpot']>[0]
  ): Promise<PhotoEntity> {
    const photo = await this.connection.tUserPhoto.create({
      data: {
        userId: params.userId,
        photoUrl: params.photoUrl,
        storagePath: params.storagePath,
        memo: params.memo ?? null,
        takenAt: params.takenAt,
        spotLinks: { create: { spotId: params.spotId } },
      },
      include: PHOTO_ATTACHMENTS_INCLUDE,
    })

    return this.toEntity(photo)
  }

  public async createPhotoForBike(
    params: Parameters<IPhotoRepository['createPhotoForBike']>[0]
  ): Promise<PhotoEntity> {
    const photo = await this.connection.tUserPhoto.create({
      data: {
        userId: params.userId,
        photoUrl: params.photoUrl,
        storagePath: params.storagePath,
        memo: params.memo ?? null,
        takenAt: params.takenAt,
        bikeLinks: { create: { userMyBikeId: params.myUserBikeId } },
      },
      include: PHOTO_ATTACHMENTS_INCLUDE,
    })

    return this.toEntity(photo)
  }

  public async findPhotosByTouringId(
    touringId: TouringId
  ): Promise<PhotoEntity[]> {
    const links = await this.connection.tUserMyBikeTouringPhoto.findMany({
      where: { touringId },
      include: { photo: { include: PHOTO_ATTACHMENTS_INCLUDE } },
      orderBy: [{ photo: { takenAt: 'asc' } }, { photo: { createdAt: 'asc' } }],
    })

    return links.map((l) => this.toEntity(l.photo))
  }

  public async findPhotosBySpotId(spotId: SpotId): Promise<PhotoEntity[]> {
    const links = await this.connection.tUserMyBikeTouringSpotPhoto.findMany({
      where: { spotId },
      include: { photo: { include: PHOTO_ATTACHMENTS_INCLUDE } },
      orderBy: [{ photo: { takenAt: 'asc' } }, { photo: { createdAt: 'asc' } }],
    })

    return links.map((l) => this.toEntity(l.photo))
  }

  public async findPhotosByMyBikeId(
    myUserBikeId: MyUserBikeId
  ): Promise<PhotoEntity[]> {
    const links = await this.connection.tUserMyBikeDirectPhoto.findMany({
      where: { userMyBikeId: myUserBikeId },
      include: { photo: { include: PHOTO_ATTACHMENTS_INCLUDE } },
      orderBy: [{ photo: { takenAt: 'asc' } }, { photo: { createdAt: 'asc' } }],
    })

    return links.map((l) => this.toEntity(l.photo))
  }

  /** ユーザーの全写真を横断して取得する（マイフォト・ギャラリー用） */
  public async findPhotosByUserId(
    userId: UserId,
    params: Parameters<IPhotoRepository['findPhotosByUserId']>[1]
  ): Promise<PhotoEntity[]> {
    const records = await this.connection.tUserPhoto.findMany({
      where: { userId },
      include: PHOTO_ATTACHMENTS_INCLUDE,
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      skip: params.skip,
      take: params.take,
    })

    return records.map((r) => this.toEntity(r))
  }

  public async findPhotoById(photoId: PhotoId): Promise<PhotoEntity | null> {
    const photo = await this.connection.tUserPhoto.findUnique({
      where: { id: photoId },
      include: PHOTO_ATTACHMENTS_INCLUDE,
    })

    if (!photo) return null

    return this.toEntity(photo)
  }

  /** 写真を削除してstoragePathを返す */
  public async deletePhoto(photoId: PhotoId): Promise<string> {
    const photo = await this.connection.tUserPhoto.delete({
      where: { id: photoId },
      select: { storagePath: true },
    })
    return photo.storagePath
  }
}

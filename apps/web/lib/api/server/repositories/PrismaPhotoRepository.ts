import {
  createPhotoId,
  createSpotId,
  createSpotPhotoId,
  createTouringId,
  createTouringPhotoId,
  createUserId,
  PhotoId,
  SpotId,
  TouringId,
} from '@repo/shared-types'
import {
  PhotoEntity,
  SpotPhotoEntity,
  TouringPhotoEntity,
} from '../entities/PhotoEntity'
import { IPhotoRepository } from '../interfaces/IPhotoRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaPhotoRepository
  extends PrismaRepositoryBase
  implements IPhotoRepository
{
  public async createPhotoForTouring(
    params: Parameters<IPhotoRepository['createPhotoForTouring']>[0]
  ): Promise<TouringPhotoEntity> {
    const photo = await this.connection.tUserMyBikePhoto.create({
      data: {
        userId: params.userId,
        photoUrl: params.photoUrl,
        storagePath: params.storagePath,
        memo: params.memo ?? null,
        takenAt: params.takenAt,
        touringPhoto: {
          create: {
            touringId: params.touringId,
            orderIndex: params.orderIndex,
          },
        },
      },
      include: {
        touringPhoto: true,
      },
    })

    if (!photo.touringPhoto) {
      throw new Error('ツーリング写真の作成に失敗しました')
    }

    return new TouringPhotoEntity({
      touringPhotoId: createTouringPhotoId(photo.touringPhoto.id),
      photoId: createPhotoId(photo.id),
      userId: createUserId(photo.userId),
      photoUrl: photo.photoUrl,
      storagePath: photo.storagePath,
      memo: photo.memo,
      takenAt: photo.takenAt,
      touringId: createTouringId(photo.touringPhoto.touringId),
      orderIndex: photo.touringPhoto.orderIndex,
    })
  }

  public async createPhotoForSpot(
    params: Parameters<IPhotoRepository['createPhotoForSpot']>[0]
  ): Promise<SpotPhotoEntity> {
    const photo = await this.connection.tUserMyBikePhoto.create({
      data: {
        userId: params.userId,
        photoUrl: params.photoUrl,
        storagePath: params.storagePath,
        memo: params.memo ?? null,
        takenAt: params.takenAt,
        spotPhoto: {
          create: {
            spotId: params.spotId,
            orderIndex: params.orderIndex,
          },
        },
      },
      include: {
        spotPhoto: true,
      },
    })

    if (!photo.spotPhoto) {
      throw new Error('スポット写真の作成に失敗しました')
    }

    return new SpotPhotoEntity({
      spotPhotoId: createSpotPhotoId(photo.spotPhoto.id),
      photoId: createPhotoId(photo.id),
      userId: createUserId(photo.userId),
      photoUrl: photo.photoUrl,
      storagePath: photo.storagePath,
      memo: photo.memo,
      takenAt: photo.takenAt,
      spotId: createSpotId(photo.spotPhoto.spotId),
      orderIndex: photo.spotPhoto.orderIndex,
    })
  }

  public async findPhotosByTouringId(
    touringId: TouringId
  ): Promise<TouringPhotoEntity[]> {
    const records = await this.connection.tUserMyBikeTouringPhoto.findMany({
      where: { touringId },
      include: { photo: true },
      orderBy: { orderIndex: 'asc' },
    })

    return records.map(
      (r) =>
        new TouringPhotoEntity({
          touringPhotoId: createTouringPhotoId(r.id),
          photoId: createPhotoId(r.photo.id),
          userId: createUserId(r.photo.userId),
          photoUrl: r.photo.photoUrl,
          storagePath: r.photo.storagePath,
          memo: r.photo.memo,
          takenAt: r.photo.takenAt,
          touringId: createTouringId(r.touringId),
          orderIndex: r.orderIndex,
        })
    )
  }

  public async findPhotosBySpotId(spotId: SpotId): Promise<SpotPhotoEntity[]> {
    const records = await this.connection.tUserMyBikeTouringSpotPhoto.findMany({
      where: { spotId },
      include: { photo: true },
      orderBy: { orderIndex: 'asc' },
    })

    return records.map(
      (r) =>
        new SpotPhotoEntity({
          spotPhotoId: createSpotPhotoId(r.id),
          photoId: createPhotoId(r.photo.id),
          userId: createUserId(r.photo.userId),
          photoUrl: r.photo.photoUrl,
          storagePath: r.photo.storagePath,
          memo: r.photo.memo,
          takenAt: r.photo.takenAt,
          spotId: createSpotId(r.spotId),
          orderIndex: r.orderIndex,
        })
    )
  }

  public async findPhotoById(photoId: PhotoId): Promise<PhotoEntity | null> {
    const photo = await this.connection.tUserMyBikePhoto.findUnique({
      where: { id: photoId },
    })

    if (!photo) return null

    return new PhotoEntity({
      photoId: createPhotoId(photo.id),
      userId: createUserId(photo.userId),
      photoUrl: photo.photoUrl,
      storagePath: photo.storagePath,
      memo: photo.memo,
      takenAt: photo.takenAt,
    })
  }

  /** 写真を削除してstoragePathを返す */
  public async deletePhoto(photoId: PhotoId): Promise<string> {
    const photo = await this.connection.tUserMyBikePhoto.delete({
      where: { id: photoId },
      select: { storagePath: true },
    })
    return photo.storagePath
  }
}

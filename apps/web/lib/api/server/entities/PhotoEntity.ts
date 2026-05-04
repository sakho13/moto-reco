import {
  Photo,
  PhotoId,
  SpotPhoto,
  SpotPhotoId,
  TouringPhoto,
  TouringPhotoId,
  UserId,
} from '@repo/shared-types'

export class PhotoEntity {
  private _value: Photo

  constructor(photo: Photo) {
    this._value = photo
  }

  public get id(): PhotoId {
    return this._value.photoId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get photoUrl(): string {
    return this._value.photoUrl
  }

  public get storagePath(): string {
    return this._value.storagePath
  }

  public get memo(): string | null {
    return this._value.memo
  }

  public get takenAt(): Date {
    return this._value.takenAt
  }

  public toJson(): Photo {
    return this._value
  }
}

export class TouringPhotoEntity {
  private _value: TouringPhoto

  constructor(photo: TouringPhoto) {
    this._value = photo
  }

  public get touringPhotoId(): TouringPhotoId {
    return this._value.touringPhotoId
  }

  public get id(): PhotoId {
    return this._value.photoId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get photoUrl(): string {
    return this._value.photoUrl
  }

  public get storagePath(): string {
    return this._value.storagePath
  }

  public get memo(): string | null {
    return this._value.memo
  }

  public get takenAt(): Date {
    return this._value.takenAt
  }

  public get orderIndex(): number {
    return this._value.orderIndex
  }

  public toJson(): TouringPhoto {
    return this._value
  }
}

export class SpotPhotoEntity {
  private _value: SpotPhoto

  constructor(photo: SpotPhoto) {
    this._value = photo
  }

  public get spotPhotoId(): SpotPhotoId {
    return this._value.spotPhotoId
  }

  public get id(): PhotoId {
    return this._value.photoId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get photoUrl(): string {
    return this._value.photoUrl
  }

  public get storagePath(): string {
    return this._value.storagePath
  }

  public get memo(): string | null {
    return this._value.memo
  }

  public get takenAt(): Date {
    return this._value.takenAt
  }

  public get orderIndex(): number {
    return this._value.orderIndex
  }

  public toJson(): SpotPhoto {
    return this._value
  }
}

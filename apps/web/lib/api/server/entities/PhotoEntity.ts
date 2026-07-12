import { Photo, PhotoAttachment, PhotoId, UserId } from '@repo/shared-types'

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

  public get attachments(): PhotoAttachment[] {
    return this._value.attachments
  }

  public toJson(): Photo {
    return this._value
  }
}

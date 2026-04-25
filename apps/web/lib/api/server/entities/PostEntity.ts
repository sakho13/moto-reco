import {
  MyUserBikeId,
  Post,
  PostId,
  PostPhoto,
  UserId,
} from '@repo/shared-types'

export class PostEntity {
  private _value: Post

  constructor(post: Post) {
    if (post.photos.length > 10) {
      throw new Error('写真は10枚以内である必要があります')
    }

    this._value = post
  }

  public get id(): PostId {
    return this._value.postId
  }

  public get userMyBikeId(): MyUserBikeId {
    return this._value.userMyBikeId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get title(): string | null {
    return this._value.title
  }

  public get description(): string | null {
    return this._value.description
  }

  public get occurredAt(): Date {
    return this._value.occurredAt
  }

  public get photos(): PostPhoto[] {
    return this._value.photos
  }

  public toJson(): Post {
    return this._value
  }
}

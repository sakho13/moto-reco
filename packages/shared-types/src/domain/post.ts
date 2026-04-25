import { MyUserBikeId } from './bike'
import { UserId } from './user'

export type PostId = string & { readonly __brand: unique symbol }
export const createPostId = (id: string): PostId => id as PostId

export type PostPhotoId = string & { readonly __brand: unique symbol }
export const createPostPhotoId = (id: string): PostPhotoId => id as PostPhotoId

export type PostPhoto = {
  postPhotoId: PostPhotoId
  postId: PostId
  photoUrl: string
  orderIndex: number
}

export type Post = {
  postId: PostId
  userMyBikeId: MyUserBikeId
  userId: UserId
  title: string | null
  description: string | null
  occurredAt: Date
  photos: PostPhoto[]
}

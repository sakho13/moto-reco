import { MyUserBikeId, PostId } from '@repo/shared-types'
import { PostEntity } from '../entities/PostEntity'

type CreatePostParams = {
  userMyBikeId: MyUserBikeId
  userId: string
  title?: string | null
  description?: string | null
  occurredAt: Date
  photoUrls: string[]
}

export interface IPostRepository {
  createPost(params: CreatePostParams): Promise<PostEntity>
  findPostsByMyBikeId(
    myUserBikeId: MyUserBikeId,
    options: { skip: number; take: number }
  ): Promise<PostEntity[]>
  findPostById(
    postId: PostId,
    myUserBikeId: MyUserBikeId
  ): Promise<PostEntity | null>
  deletePost(postId: PostId, myUserBikeId: MyUserBikeId): Promise<void>
}

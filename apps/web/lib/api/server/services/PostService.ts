import { createPostId, MyUserBikeId, PostId, UserId } from '@repo/shared-types'
import { PostEntity } from '../entities/PostEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { IPostRepository } from '../interfaces/IPostRepository'

type RegisterPostParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  title?: string | null
  description?: string | null
  occurredAt: Date
  photoUrls: string[]
}

type DeletePostParams = {
  postId: PostId
  myUserBikeId: MyUserBikeId
  userId: UserId
}

export class PostService {
  constructor(
    private postRepository: IPostRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerPost(params: RegisterPostParams): Promise<PostEntity> {
    if (params.role === 'GUEST') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲストアカウントはヒストリー投稿を利用できません'
      )
    }

    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return await this.postRepository.createPost({
      userMyBikeId: params.myUserBikeId,
      userId: params.userId,
      title: params.title,
      description: params.description,
      occurredAt: params.occurredAt,
      photoUrls: params.photoUrls,
    })
  }

  public async getPosts(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    options: { page: number; pageSize: number }
  ): Promise<PostEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const skip = (options.page - 1) * options.pageSize
    return await this.postRepository.findPostsByMyBikeId(myUserBikeId, {
      skip,
      take: options.pageSize,
    })
  }

  public async getPostById(
    postId: PostId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<PostEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const post = await this.postRepository.findPostById(postId, myUserBikeId)

    if (!post) {
      throw new ApiV1Error('NOT_FOUND', '指定された投稿が見つかりません')
    }

    return post
  }

  public async deletePost(params: DeletePostParams): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const post = await this.postRepository.findPostById(
      params.postId,
      params.myUserBikeId
    )

    if (!post) {
      throw new ApiV1Error('NOT_FOUND', '指定された投稿が見つかりません')
    }

    await this.postRepository.deletePost(params.postId, params.myUserBikeId)
  }
}

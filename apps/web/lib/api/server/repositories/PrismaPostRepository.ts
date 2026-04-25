import {
  createMyUserBikeId,
  createPostId,
  createPostPhotoId,
  createUserId,
  MyUserBikeId,
  PostId,
} from '@repo/shared-types'
import { PostEntity } from '../entities/PostEntity'
import { IPostRepository } from '../interfaces/IPostRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaPostRepository
  extends PrismaRepositoryBase
  implements IPostRepository
{
  async createPost(
    params: Parameters<IPostRepository['createPost']>[0]
  ): Promise<PostEntity> {
    const record = await this.connection.tUserMyBikePost.create({
      data: {
        userMyBikeId: params.userMyBikeId,
        userId: params.userId,
        title: params.title ?? null,
        description: params.description ?? null,
        occurredAt: params.occurredAt,
        photos: {
          create: params.photoUrls.map((url, index) => ({
            photoUrl: url,
            orderIndex: index,
          })),
        },
      },
      include: {
        photos: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return new PostEntity({
      postId: createPostId(record.id),
      userMyBikeId: createMyUserBikeId(record.userMyBikeId),
      userId: createUserId(record.userId),
      title: record.title,
      description: record.description,
      occurredAt: record.occurredAt,
      photos: record.photos.map((p) => ({
        postPhotoId: createPostPhotoId(p.id),
        postId: createPostId(p.postId),
        photoUrl: p.photoUrl,
        orderIndex: p.orderIndex,
      })),
    })
  }

  async findPostsByMyBikeId(
    myUserBikeId: MyUserBikeId,
    options: { skip: number; take: number }
  ): Promise<PostEntity[]> {
    const records = await this.connection.tUserMyBikePost.findMany({
      where: { userMyBikeId: myUserBikeId },
      include: {
        photos: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { occurredAt: 'desc' },
      skip: options.skip,
      take: options.take,
    })

    return records.map(
      (record) =>
        new PostEntity({
          postId: createPostId(record.id),
          userMyBikeId: createMyUserBikeId(record.userMyBikeId),
          userId: createUserId(record.userId),
          title: record.title,
          description: record.description,
          occurredAt: record.occurredAt,
          photos: record.photos.map((p) => ({
            postPhotoId: createPostPhotoId(p.id),
            postId: createPostId(p.postId),
            photoUrl: p.photoUrl,
            orderIndex: p.orderIndex,
          })),
        })
    )
  }

  async findPostById(
    postId: PostId,
    myUserBikeId: MyUserBikeId
  ): Promise<PostEntity | null> {
    const record = await this.connection.tUserMyBikePost.findFirst({
      where: { id: postId, userMyBikeId: myUserBikeId },
      include: {
        photos: { orderBy: { orderIndex: 'asc' } },
      },
    })

    if (!record) return null

    return new PostEntity({
      postId: createPostId(record.id),
      userMyBikeId: createMyUserBikeId(record.userMyBikeId),
      userId: createUserId(record.userId),
      title: record.title,
      description: record.description,
      occurredAt: record.occurredAt,
      photos: record.photos.map((p) => ({
        postPhotoId: createPostPhotoId(p.id),
        postId: createPostId(p.postId),
        photoUrl: p.photoUrl,
        orderIndex: p.orderIndex,
      })),
    })
  }

  async deletePost(postId: PostId, myUserBikeId: MyUserBikeId): Promise<void> {
    await this.connection.tUserMyBikePost.delete({
      where: { id: postId, userMyBikeId: myUserBikeId },
    })
  }
}

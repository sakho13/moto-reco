import { prisma } from '@repo/database'

/**
 * テスト用ツーリング写真をPrismaで直接作成する
 */
export async function createTestTouringPhoto(params: {
  userId: string
  touringId: string
  orderIndex?: number
}): Promise<string> {
  const photo = await prisma.tUserMyBikePhoto.create({
    data: {
      userId: params.userId,
      photoUrl: 'https://storage.example.com/test.jpg',
      storagePath: `users/${params.userId}/photos/test-${Date.now()}.jpg`,
      takenAt: new Date(),
      touringPhoto: {
        create: {
          touringId: params.touringId,
          orderIndex: params.orderIndex ?? 0,
        },
      },
    },
  })
  return photo.id
}

/**
 * テスト用スポット写真をPrismaで直接作成する
 */
export async function createTestSpotPhoto(params: {
  userId: string
  spotId: string
  orderIndex?: number
}): Promise<string> {
  const photo = await prisma.tUserMyBikePhoto.create({
    data: {
      userId: params.userId,
      photoUrl: 'https://storage.example.com/test.jpg',
      storagePath: `users/${params.userId}/photos/test-${Date.now()}.jpg`,
      takenAt: new Date(),
      spotPhoto: {
        create: {
          spotId: params.spotId,
          orderIndex: params.orderIndex ?? 0,
        },
      },
    },
  })
  return photo.id
}
